-- Hybrid Crawler Pattern Learning System
-- Stores extraction patterns learned from Agent runs for cheaper direct scraping

-- Table: extraction_patterns
-- Stores learned patterns for extracting booth data from specific sources
CREATE TABLE extraction_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES crawl_sources(id) ON DELETE CASCADE,

  -- Pattern metadata
  pattern_type TEXT NOT NULL CHECK (pattern_type IN ('css_selector', 'xpath', 'json_path', 'regex', 'compound')),
  field_name TEXT NOT NULL, -- e.g., 'name', 'address', 'city', 'hours'

  -- Pattern definition
  selector TEXT NOT NULL, -- CSS selector, XPath, or other pattern
  fallback_selectors TEXT[], -- Alternative selectors if primary fails
  extraction_method TEXT DEFAULT 'text' CHECK (extraction_method IN ('text', 'attr', 'html', 'json')),
  extraction_args JSONB, -- e.g., {"attr": "href"} or {"json_path": "$.data.name"}

  -- Validation rules
  validation_regex TEXT, -- Pattern to validate extracted value
  required BOOLEAN DEFAULT false, -- Whether this field is required
  transform_fn TEXT, -- Optional transformation function name

  -- Performance tracking
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  confidence_score DECIMAL(3, 2) DEFAULT 1.0 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  avg_extraction_time_ms INTEGER,

  -- Agent learning metadata
  learned_from_agent_run_id UUID, -- Reference to crawler_metrics.id
  learned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_validated_at TIMESTAMP WITH TIME ZONE,
  last_used_at TIMESTAMP WITH TIME ZONE,

  -- Status
  is_active BOOLEAN DEFAULT true,
  deprecated_reason TEXT,
  deprecated_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  -- Unique constraint: one pattern per field per source
  UNIQUE (source_id, field_name, selector)
);

CREATE INDEX idx_extraction_patterns_source_id ON extraction_patterns(source_id);
CREATE INDEX idx_extraction_patterns_active ON extraction_patterns(source_id, is_active) WHERE is_active = true;
CREATE INDEX idx_extraction_patterns_confidence ON extraction_patterns(confidence_score DESC);

-- Table: extraction_validations
-- Tracks validation results for patterns over time
CREATE TABLE extraction_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_id UUID NOT NULL REFERENCES extraction_patterns(id) ON DELETE CASCADE,
  crawl_run_id UUID REFERENCES crawler_metrics(id) ON DELETE CASCADE,

  -- Validation result
  success BOOLEAN NOT NULL,
  extracted_value TEXT,
  validation_error TEXT,
  extraction_time_ms INTEGER,

  -- Context
  source_url TEXT NOT NULL,
  html_snippet TEXT, -- First 500 chars of HTML where pattern was applied

  validated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_extraction_validations_pattern_id ON extraction_validations(pattern_id);
CREATE INDEX idx_extraction_validations_crawl_run_id ON extraction_validations(crawl_run_id);
CREATE INDEX idx_extraction_validations_success ON extraction_validations(pattern_id, success);
CREATE INDEX idx_extraction_validations_validated_at ON extraction_validations(validated_at DESC);

-- Add extraction mode to crawl_sources table
ALTER TABLE crawl_sources
ADD COLUMN extraction_mode TEXT DEFAULT 'agent' CHECK (extraction_mode IN ('agent', 'direct', 'hybrid')),
ADD COLUMN pattern_learning_status TEXT DEFAULT 'not_started' CHECK (pattern_learning_status IN ('not_started', 'in_progress', 'completed', 'failed')),
ADD COLUMN pattern_learned_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN direct_scraping_enabled BOOLEAN DEFAULT false;

CREATE INDEX idx_crawl_sources_extraction_mode ON crawl_sources(extraction_mode);
CREATE INDEX idx_crawl_sources_direct_enabled ON crawl_sources(direct_scraping_enabled) WHERE direct_scraping_enabled = true;

-- Function: update_pattern_confidence
-- Recalculates confidence score based on success/failure ratio
CREATE OR REPLACE FUNCTION update_pattern_confidence()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE extraction_patterns
  SET
    success_count = success_count + CASE WHEN NEW.success THEN 1 ELSE 0 END,
    failure_count = failure_count + CASE WHEN NOT NEW.success THEN 1 ELSE 0 END,
    confidence_score = CASE
      WHEN (success_count + failure_count + 1) > 0
      THEN (success_count + CASE WHEN NEW.success THEN 1 ELSE 0 END)::DECIMAL / (success_count + failure_count + 1)
      ELSE 1.0
    END,
    last_validated_at = NEW.validated_at,
    updated_at = now()
  WHERE id = NEW.pattern_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: update pattern confidence on validation
CREATE TRIGGER trigger_update_pattern_confidence
AFTER INSERT ON extraction_validations
FOR EACH ROW
EXECUTE FUNCTION update_pattern_confidence();

-- Function: deprecate_low_confidence_patterns
-- Marks patterns as deprecated if confidence drops below threshold
CREATE OR REPLACE FUNCTION deprecate_low_confidence_patterns(
  confidence_threshold DECIMAL DEFAULT 0.5,
  min_validations INTEGER DEFAULT 10
)
RETURNS TABLE (
  pattern_id UUID,
  source_name TEXT,
  field_name TEXT,
  old_confidence DECIMAL,
  validation_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  UPDATE extraction_patterns ep
  SET
    is_active = false,
    deprecated_reason = 'Low confidence score: ' || ep.confidence_score::TEXT,
    deprecated_at = now()
  FROM crawl_sources cs
  WHERE
    ep.source_id = cs.id
    AND ep.is_active = true
    AND ep.confidence_score < confidence_threshold
    AND (ep.success_count + ep.failure_count) >= min_validations
  RETURNING
    ep.id as pattern_id,
    cs.name as source_name,
    ep.field_name,
    ep.confidence_score as old_confidence,
    (ep.success_count + ep.failure_count) as validation_count;
END;
$$ LANGUAGE plpgsql;

-- Function: get_active_patterns_for_source
-- Retrieves all active patterns for a source, ordered by confidence
CREATE OR REPLACE FUNCTION get_active_patterns_for_source(p_source_id UUID)
RETURNS TABLE (
  id UUID,
  field_name TEXT,
  pattern_type TEXT,
  selector TEXT,
  fallback_selectors TEXT[],
  extraction_method TEXT,
  extraction_args JSONB,
  validation_regex TEXT,
  required BOOLEAN,
  transform_fn TEXT,
  confidence_score DECIMAL,
  success_count INTEGER,
  failure_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ep.id,
    ep.field_name,
    ep.pattern_type,
    ep.selector,
    ep.fallback_selectors,
    ep.extraction_method,
    ep.extraction_args,
    ep.validation_regex,
    ep.required,
    ep.transform_fn,
    ep.confidence_score,
    ep.success_count,
    ep.failure_count
  FROM extraction_patterns ep
  WHERE
    ep.source_id = p_source_id
    AND ep.is_active = true
  ORDER BY
    ep.confidence_score DESC,
    ep.success_count DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- View: pattern_health_dashboard
-- Summary view of pattern health across all sources
CREATE VIEW pattern_health_dashboard AS
SELECT
  cs.id as source_id,
  cs.name as source_name,
  cs.extraction_mode,
  cs.pattern_learning_status,
  cs.direct_scraping_enabled,
  COUNT(ep.id) as total_patterns,
  COUNT(CASE WHEN ep.is_active THEN 1 END) as active_patterns,
  COUNT(CASE WHEN ep.is_active = false THEN 1 END) as deprecated_patterns,
  AVG(CASE WHEN ep.is_active THEN ep.confidence_score END) as avg_confidence,
  SUM(ep.success_count) as total_successes,
  SUM(ep.failure_count) as total_failures,
  MAX(ep.last_validated_at) as last_validation
FROM crawl_sources cs
LEFT JOIN extraction_patterns ep ON cs.id = ep.source_id
GROUP BY cs.id, cs.name, cs.extraction_mode, cs.pattern_learning_status, cs.direct_scraping_enabled
ORDER BY cs.name;

-- Grant permissions
GRANT SELECT ON extraction_patterns TO anon, authenticated;
GRANT SELECT ON extraction_validations TO anon, authenticated;
GRANT SELECT ON pattern_health_dashboard TO anon, authenticated;

-- Service role has full access
GRANT ALL ON extraction_patterns TO service_role;
GRANT ALL ON extraction_validations TO service_role;

-- Comments
COMMENT ON TABLE extraction_patterns IS 'Stores learned patterns for direct scraping, learned from Agent runs';
COMMENT ON TABLE extraction_validations IS 'Tracks validation results for extraction patterns over time';
COMMENT ON COLUMN crawl_sources.extraction_mode IS 'agent: always use Agent, direct: always use patterns, hybrid: try patterns first, fallback to Agent';
COMMENT ON COLUMN extraction_patterns.confidence_score IS 'Success rate (0-1) calculated from success_count / (success_count + failure_count)';
COMMENT ON FUNCTION update_pattern_confidence IS 'Auto-updates pattern confidence score when new validation is inserted';
COMMENT ON FUNCTION deprecate_low_confidence_patterns IS 'Marks patterns with low confidence (<0.5) and enough validations (>10) as deprecated';
COMMENT ON VIEW pattern_health_dashboard IS 'Dashboard view showing pattern health metrics across all sources';

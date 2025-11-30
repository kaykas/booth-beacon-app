# Sources That Need URL Corrections

These 18 sources returned 0 booths. They need URL research and correction in the database.

## CONFIRMED BAD URLS (Tested Manually)

### 1. Accidentally Wes Anderson
- **Current URL**: `https://accidentallywesanderson.com/photobooths`
- **Status**: 404 Not Found
- **Issue**: Page doesn't exist

### 2. Aperture Tours Berlin
- **Current URL**: `https://aperturetours.com/berlin-photo-booths`
- **Status**: 404 Not Found
- **Issue**: Page doesn't exist

### 3. Concrete Playground
- **Current URL**: `https://concreteplayground.com/photo-booths`
- **Status**: 404 Not Found
- **Issue**: Page doesn't exist

### 4. Digital Cosmonaut Berlin
- **Current URL**: `https://digitalcosmonaut.com/photo-booths-berlin`
- **Status**: WRONG PAGE - About abandoned buildings, not photo booths!
- **Issue**: Completely incorrect content

## LIKELY BAD URLS (Returned 0 Booths)

### 5. Autophoto
- **Current URL**: `https://autophoto.org`
- **Scraped**: 940 chars
- **Issue**: Minimal content, likely wrong page or homepage only

### 6. autophoto.org (Duplicate?)
- **Current URL**: `https://autophoto.org/`
- **Scraped**: 940 chars
- **Issue**: Same as above, duplicate source?

### 7. Classic Photo Booth Co
- **Current URL**: `https://classicphotoboothco.com/locations`
- **Scraped**: 115 chars
- **Issue**: Very minimal content, page may be empty or redirected

### 8. Do The Bay SF
- **Current URL**: `https://dothebay.com/photo-booths-san-francisco`
- **Scraped**: 1011 chars
- **Issue**: Minimal content

### 9. Flash Pack
- **Current URL**: `https://www.theflashpack.com/photobooths`
- **Scraped**: 13,470 chars
- **Issue**: Has content but no booths extracted

### 10. Flash Pack London
- **Current URL**: `https://www.theflashpack.com/london/photo-booths`
- **Scraped**: 13,470 chars
- **Issue**: Has content but no booths extracted (same content as above?)

### 11. Lomography Locations
- **Current URL**: `https://www.lomography.com/magazine/tipster/photobooth-locations`
- **Scraped**: 23,869 chars
- **Issue**: Has content but no booths extracted (might be photos only, not locations)

### 12. lomography.com (Duplicate?)
- **Current URL**: `https://www.lomography.com/photos/booths`
- **Scraped**: 23,620 chars
- **Issue**: Same as above, duplicate source?

### 13. London World
- **Current URL**: `https://londonworld.com/photo-booths`
- **Scraped**: 1,676 chars
- **Issue**: Minimal content

### 14. No Camera Bag Vienna
- **Current URL**: `https://www.nocamerabag.com/vienna-photo-booths`
- **Scraped**: 784 chars
- **Issue**: Very minimal content

### 15. photobooth.net (Homepage)
- **Current URL**: `https://www.photobooth.net/`
- **Scraped**: 23,941 chars
- **Issue**: This is the homepage - we already have 742 booths from their JSON API
- **Note**: Should disable this source since we have the JSON API crawler

### 16. Photomatic
- **Current URL**: `https://photomatic.com.au`
- **Scraped**: 4,035 chars
- **Issue**: Has content but no booths extracted

## NETWORK FAILURES (Need Retry)

### 17. Airial Travel Brooklyn
- **Current URL**: `https://www.airialtravel.com/brooklyn-photo-booths`
- **Status**: Firecrawl 500 error (all engines failed)
- **Action**: Verify URL is correct, may need different crawling approach

### 18. Fotoautomat Wien
- **Current URL**: `https://www.fotoautomat-wien.at`
- **Status**: Network timeout
- **Action**: Retry, may be temporary issue

### 19. Girl in Florence
- **Current URL**: `https://www.girl-in-florence.com/photo-booths/`
- **Status**: Network timeout
- **Action**: Retry, may be temporary issue

### 20. Metro Auto Photo
- **Current URL**: `https://www.metroautophoto.com`
- **Status**: Network timeout
- **Action**: Retry, may be temporary issue

### 21. Misadventures with Andi
- **Current URL**: `https://www.misadventureswithand.com/photo-booths`
- **Status**: Network timeout
- **Action**: Retry, may be temporary issue

### 22. Phelt Magazine Berlin
- **Current URL**: `https://pheltmag.com/berlin-photobooths`
- **Status**: Network timeout
- **Action**: Retry, may be temporary issue

### 23. photomatic.net
- **Current URL**: `https://photomatic.net/`
- **Status**: Network timeout
- **Action**: Retry, may be temporary issue

### 24. Flickr Photobooth Group
- **Current URL**: `https://www.flickr.com/groups/photobooth/`
- **Status**: 403 Forbidden (not supported by Firecrawl)
- **Action**: Need different approach (API or manual scraping)

## POSSIBLE DUPLICATES (To Review)

- **autophoto.org** appears twice with same URL
- **lomography.com** appears twice with different URLs but similar content
- **photoautomat.de** appears twice (both worked, inserted 2 booths total)
- **photomatica.com** appears twice (both worked, inserted 4 booths total)

## SUMMARY

- **4 Confirmed 404s**: Need new URLs entirely
- **1 Wrong page**: Digital Cosmonaut needs correct URL
- **11 Low/No content**: Need URL verification
- **7 Network failures**: Retry needed
- **1 Flickr**: Needs special handling (API?)

Total: **24 sources** need attention

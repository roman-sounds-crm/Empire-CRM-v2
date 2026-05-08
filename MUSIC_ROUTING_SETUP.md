# Music Routing Setup — songs.romansounds.com

## DNS Configuration (Required)

Contact your DNS provider and add:

```
Name:  songs
Type:  CNAME
Value: manage.romansounds.com
TTL:   Auto
```

Verify with: `nslookup songs.romansounds.com`

## Public Landing Page

The app already has a public song requests page at:
- **Route:** `/portal/requests` (no auth required)
- **Works with:** `songs.romansounds.com/portal/requests`

No additional setup needed — the public page is already accessible.

## Testing

1. Once DNS propagates (24h):
   - Visit `songs.romansounds.com`
   - Should load the app
   - Navigate to `/requests` path
   - Submit song request
   - Should appear in admin dashboard

## Notes

- Public page requires no authentication
- Requests go directly to song_requests table
- Admin sees all requests in Song Requests dashboard
- Can be customized further if needed

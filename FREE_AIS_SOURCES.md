# Free Real-Time AIS Vessel Position Sources

| Source | Free Tier | Notes |
|--------|-----------|-------|
| **aisstream.io** | Yes (already integrated) | WebSocket stream, free API key at aisstream.io |
| **AISHub** | Free with reciprocity | Must share your own AIS receiver data to get access |
| **MarineTraffic** | Very limited | Free tier is heavily rate-limited, mostly historical |
| **VesselFinder** | Very limited | Similar to MarineTraffic |
| **AIS-catcher + RTL-SDR** | Free (hardware cost ~$25) | Receive your own AIS data locally with a cheap USB radio dongle |

## Recommendation

Stick with **aisstream.io**. If you don't have an API key yet, sign up at aisstream.io — the free tier covers a reasonable number of vessels and bounding boxes, which is exactly what `server/src/services/AISService.js` is already set up to use.

If you want wider global coverage for free, **AISHub** is the next best option, but requires you to contribute data (i.e., you'd need an RTL-SDR dongle to receive local AIS signals).

import urllib.request
import urllib.parse
import json
import time

tracks_to_fix = [
    { "title": "30 for 30", "artist": "SZA" },
    { "title": "A Bar Song (Tipsy)", "artist": "Shaboozey" },
    { "title": "APT.", "artist": "Rosé" },
    { "title": "BMF", "artist": "SZA" },
    { "title": "Bed Chem", "artist": "Sabrina Carpenter" },
    { "title": "Birds of a Feather", "artist": "Billie Eilish" },
    { "title": "DTMF", "artist": "Bad Bunny" },
    { "title": "Denial Is a River", "artist": "Doechii" },
    { "title": "Die with a Smile", "artist": "Lady Gaga" },
    { "title": "Eoo", "artist": "Bad Bunny" },
    { "title": "Espresso", "artist": "Sabrina Carpenter" },
    { "title": "Golden", "artist": "Huntrix" },
    { "title": "Hard Fought Hallelujah", "artist": "Brandon Lake" },
    { "title": "I'm Gonna Love You", "artist": "Cody Johnson" },
    { "title": "Lose Control", "artist": "Teddy Swims" },
    { "title": "Luther", "artist": "Kendrick Lamar" },
    { "title": "Manchild", "artist": "Sabrina Carpenter" },
    { "title": "Mutt", "artist": "Leon Thomas" },
    { "title": "Nokia", "artist": "Drake" },
    { "title": "Not Like Us", "artist": "Kendrick Lamar" },
    { "title": "Ordinary", "artist": "Alex Warren" },
    { "title": "Please Please Please", "artist": "Sabrina Carpenter" },
    { "title": "Somebody Loves Me", "artist": "PartyNextDoor" },
    { "title": "Sports Car", "artist": "Tate McRae" },
    { "title": "Squabble Up", "artist": "Kendrick Lamar" },
    { "title": "Stargazing", "artist": "Myles Smith" },
    { "title": "TV Off", "artist": "Kendrick Lamar" },
    { "title": "Timeless", "artist": "The Weeknd" },
    { "title": "What I Want", "artist": "Morgan Wallen" },
    { "title": "What It Sounds Like", "artist": "Huntrix" },
    { "title": "Wildflower", "artist": "Billie Eilish" },
    { "title": "I Had Some Help", "artist": "Post Malone" },
    { "title": "Soda Pop", "artist": "Saja Boys" }
]

new_mapping = {}

print("Fetching Artwork from iTunes API...")
for t in tracks_to_fix:
    term = urllib.parse.quote(f"{t['title']} {t['artist']}")
    url = f"https://itunes.apple.com/search?term={term}&entity=song&limit=1"
    
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        response = urllib.request.urlopen(req)
        data = json.loads(response.read().decode('utf-8'))
        
        if data['resultCount'] > 0:
            # Get the 100x100 URL and replace it with 600x600 for better quality
            artwork = data['results'][0]['artworkUrl100'].replace('100x100bb', '600x600bb')
            new_mapping[t['title']] = artwork
        else:
            new_mapping[t['title']] = ""
    except Exception as e:
        print(f"Failed {t['title']}: {e}")
        new_mapping[t['title']] = ""
    time.sleep(0.5)

print("\n--- RESULTS ---")
print(json.dumps(new_mapping))

import urllib.request
import urllib.parse
import urllib.error
import json
import re

forbidden = ['30 for 30', 'BMF', 'Bed Chem', 'DTMF', 'Denial Is a River', 'Eoo', 'Golden', 'Hard Fought Hallelujah', "I'm Gonna Love You", 'Luther', 'Manchild', 'Mutt', 'Nokia', 'Ordinary', 'Please Please Please', 'Somebody Loves Me', 'Sports Car', 'Squabble Up', 'Stargazing', 'TV Off', 'Timeless', 'What I Want', 'What It Sounds Like', 'Wildflower', 'Post Malone', 'Soda Pop']

# Original tracks, just the ones we need to replace
tracks_to_fix = [
    { "title": "30 for 30", "artist": "SZA" },
    { "title": "BMF", "artist": "SZA" },
    { "title": "Bed Chem", "artist": "Sabrina Carpenter" },
    { "title": "DTMF", "artist": "Bad Bunny" },
    { "title": "Denial Is a River", "artist": "Doechii" },
    { "title": "Eoo", "artist": "Bad Bunny" },
    { "title": "Golden", "artist": "Huntrix" },
    { "title": "Hard Fought Hallelujah", "artist": "Brandon Lake" },
    { "title": "I'm Gonna Love You", "artist": "Cody Johnson" },
    { "title": "Luther", "artist": "Kendrick Lamar" },
    { "title": "Manchild", "artist": "Sabrina Carpenter" },
    { "title": "Mutt", "artist": "Leon Thomas" },
    { "title": "Nokia", "artist": "Drake" },
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

def check_embeddable(yt_id):
    url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={yt_id}&format=json"
    try:
        urllib.request.urlopen(url)
        return True
    except:
        return False

def search_yt(query):
    query = urllib.parse.quote(query)
    url = f"https://www.youtube.com/results?search_query={query}"
    # Use generic user agent to prevent basic blocking
    headers = {'User-Agent': 'Mozilla/5.0'}
    req = urllib.request.Request(url, headers=headers)
    try:
        html = urllib.request.urlopen(req).read().decode('utf-8')
        # find watch?v= format
        matches = re.findall(r'"videoId":"([a-zA-Z0-9_-]{11})"', html)
        return list(dict.fromkeys(matches)) # dedupe
    except Exception as e:
        print("Error searching", e)
        return []

new_mapping = {}

for t in tracks_to_fix:
    search_q = f"{t['title']} {t['artist']} lyric video"
    print(f"Searching for {search_q}...")
    ids = search_yt(search_q)
    found = False
    for vid in ids[:5]: # check top 5
        if check_embeddable(vid):
            new_mapping[t['title']] = vid
            print(f"OK Found {vid} for {t['title']}")
            found = True
            break
    if not found:
        print(f"FAIL Could not find embeddable video for {t['title']}")

print("\n--- RESULTS ---")
print(json.dumps(new_mapping))

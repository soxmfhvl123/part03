import urllib.request
import urllib.error
import json

tracks = [
    { "title": "30 for 30", "ytId": "bO147N08R6g" },
    { "title": "A Bar Song (Tipsy)", "ytId": "t7bQwwqW-Hc" },
    { "title": "APT.", "ytId": "ekr2nIex040" },
    { "title": "BMF", "ytId": "AWkH_ZcOrlA" },
    { "title": "Bed Chem", "ytId": "bYyia4S8Rz0" },
    { "title": "Birds of a Feather", "ytId": "d5gf9dXbPi0" },
    { "title": "DTMF", "ytId": "-vY4Hk_KxLg" }, 
    { "title": "Denial Is a River", "ytId": "9oD9O2wW_0I" },
    { "title": "Die with a Smile", "ytId": "kPa7bsKwL-c" },
    { "title": "Eoo", "ytId": "g4x1v8B2l1M" },
    { "title": "Espresso", "ytId": "eVli-tstM5E" },
    { "title": "Golden", "ytId": "QYh69nF56tE" }, 
    { "title": "Hard Fought Hallelujah", "ytId": "2n9v054A2h4" }, 
    { "title": "I'm Gonna Love You", "ytId": "7L_8q91iK24" },
    { "title": "Lose Control", "ytId": "GZ3zL7kT6_c" },
    { "title": "Luther", "ytId": "bO147N08R6g" }, 
    { "title": "Manchild", "ytId": "p6n3A_N_D8M" }, 
    { "title": "Mutt", "ytId": "9nL3h7O6U-w" },
    { "title": "Nokia", "ytId": "5Ff801v0UqU" }, 
    { "title": "Not Like Us", "ytId": "T6eK-2OQtew" },
    { "title": "Ordinary", "ytId": "7hW_O-O_60w" }, 
    { "title": "Please Please Please", "ytId": "cF1Pv0_pQyA" },
    { "title": "Somebody Loves Me", "ytId": "o5oXU88XkGE" }, 
    { "title": "Sports Car", "ytId": "B50oD1D9lGg" }, 
    { "title": "Squabble Up", "ytId": "VwQ4oE-L2nI" },
    { "title": "Stargazing", "ytId": "6XzXfIe4A10" },
    { "title": "TV Off", "ytId": "w7zH-fHhD9I" }, 
    { "title": "Timeless", "ytId": "Hj9p_Y_H-E8" },
    { "title": "What I Want", "ytId": "2b0_A5m_08c" }, 
    { "title": "What It Sounds Like", "ytId": "yH8M5G7XzR8" }, 
    { "title": "Wildflower", "ytId": "1PZz1u2uA8I" },
    { "title": "Post Malone", "ytId": "QjPeo3I-174" }, 
    { "title": "Soda Pop", "ytId": "Q_U5C8jT0bU" } 
]

forbidden = []

for t in tracks:
    url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={t['ytId']}&format=json"
    try:
        response = urllib.request.urlopen(url)
        data = json.loads(response.read().decode('utf-8'))
        # if successful, it's usually embeddable
    except urllib.error.HTTPError as e:
        if e.code == 401 or e.code == 404:
            forbidden.append(t['title'])

print("Forbidden: ", forbidden)

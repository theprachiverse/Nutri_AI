import requests

url = "https://publications.gc.ca/collections/collection_2019/sc-hc/H164-231-2019-eng.pdf"
session = requests.Session()
# First request to get the cookie
response1 = session.get(url, verify=False, allow_redirects=False)

# Second request to the actual URL, pretending we came from the archived page
headers = {
    "Referer": "https://publications.gc.ca/site/archivee-archived.html?url=https%3A%2F%2Fpublications.gc.ca%2Fcollections%2Fcollection_2019%2Fsc-hc%2FH164-231-2019-eng.pdf"
}
response2 = session.get(url, headers=headers, verify=False, allow_redirects=True)
print("Response size:", len(response2.content))
if b'%PDF' in response2.content[:1024]:
    print("Success!")
    with open("corpus/raw/D2.pdf", "wb") as f:
        f.write(response2.content)
else:
    print("Failed")

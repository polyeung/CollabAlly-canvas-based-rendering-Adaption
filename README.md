# CollabAlly Project Report

Adapt CollabAlly with canvas-based rendering
Yang Li
University of Michigan, CoE, CS

### Introduction

CollabAlly is a system that makes collaboration awareness in document editing accessible to blind users. CollabAlly extracts collaborator, comment, and text-change information and their context from a document and presents them in a dialog box to provide easy access and navigation.

### Problem

Google recently changed google doc from html-base rendering to canvas-base rendering. Since canvas-based rendering fills up <canvas> element with javascript, the traditional method the past researchers implemented is not working well right now. The past method including obtaining text element through dom tree is restricted by canvas-based rendering feature. Therefore, some adjustments to our codes are needed to adapt this.

### Analysis of Codes

Chrome extension part

- background.js
    - listener 1
        - triggered by Shift+Alt+0
        - construct connection with backend api through socket
    - listener 2
        - triggered by Shift+Alt+1
        - display content.js in tab for user
    - listener 3
        - triggered by Shift+Alt+2
        - display setting windows to users
    - listener 4
        - triggered by TODO
        - get collaborators in current pages
- content.js
    - findLCA()
        - find the lowest common ancestors in dom tree for two targets
        - mainly used for find what component two cursors are both on
    
    - getUpdatedDoc()
        - get the large page element with
        
        ```cpp
        var doc_pages = document.getElementsByClassName("kix-page-paginated");
        ```
        
        - then get the span for each page ⇒ get the text on google doc
        - push every text to docHTMLContextJSON dictionary
        - push every text object along with coordinates of this text to docHTMLElementMap
        
    - findCursorElement(cursorYOffset)
        - for every text context we found previously, check whether the distance between the cursorYOffset and the position of that text is within 5
        - if so, then return the corresponding text element/object as well as page index, this indicates that the cursor is hovered on that text
    
    - getCollabStates(url)
        - call getUpdatedDoc to obtain updated version of google docs and store to data structure
        - get all collaborator_cursors with following:
        
        ```cpp
        var cursor_name = collaborator_cursors[i].getElementsByClassName("kix-cursor-name")[0].innerText;
        ```
        
        - then for every cursor , we can read the position of it
        - and store following info to dictionary
        
        ```cpp
        {
        "pos" : ,
        "element": ,
        "page": ,
        "context": ,
        "text": ,
        }
        ```
        
        - return all info in collaborator_levels dictionary
    
    - compareMaps(map1, map2)
        - this function compare two maps,(old state: map1, new state: map2)
        - get onlineCollabs with following
        
        ```cpp
        let onlineCollabs = document.getElementsByClassName("docs-presence-plus-collab-widget-container goog-inline-block docs-presence-plus-collab-widget-focus");
        ```
        
        - if there are same user and with different position now, push the new position info to movedCollaborators dictionary
        - else ⇒ we push this idle users to idleCollaborators dictionary
        - also filter out the new collaborators and push to newCollaborators dictionary
        - return different updated dictionary
        
    - getContext(levels)
        - the input levels parameter is generated from getCollabStates(url)
    
    - getCollabComments(url)
        - Get comment Div elements
        - Get highlighted text element
        - get the textBlock, author, timestamp, commentText for each commentDiv
        - store the info into dictionary and return
    
    - getCommentLocation(docText)
        - loop through docHTMLContextJSON and check each text
        - if the text match, calculate the position ratio in that page and determine whether it’s in bottom/top/center
        - return the result with location info

---

### Detailed Analysis

Codes that can not work

- Get the class of highlighted text elements

```cpp
let highlightedDiv = document.getElementsByClassName("kix-htmloverlay docs-ui-unprintable kix-htmloverlay-under-text");
```

- Get the doc height

```cpp
const docHeight = document.getElementsByClassName("kix-page-paginated")[0];
```

- Get the text on pages

```cpp
var page_text = doc_pages[i].getElementsByClassName("kix-wordhtmlgenerator-word-node");
```

Codes that can work

- Get collaborators in google doc

```cpp
let onlineCollabs = document.getElementsByClassName("docs-presence-plus-collab-widget-container goog-inline-block docs-presence-plus-collab-widget-focus");
```

- Get the name of collaborators

```cpp
let collab_name = collab.getAttribute("aria-label");
```

- Get the comment div element

```cpp
let commentDiv = document.getElementsByClassName("docos-docoview-tesla-conflict docos-docoview-resolve-button-visible docos-anchoreddocoview");
```

- Get closest comment

```cpp
let closestCommentBlock = comment.getElementsByClassName("docos-anchoreddocoview-content docos-docoview-replycontainer")[0];
```

- Get the pages div

```cpp
var doc_pages = document.getElementsByClassName("kix-page-paginated");
```

- Get the width of page

```cpp
var docWidth = document.getElementsByClassName("kix-page-paginated")[0];
```

- Get the cursor element

```cpp
var collaborator_cursors = document.getElementsByClassName("kix-cursor docs-ui-unprintable");
```

- Get the name of cursor (collaborators’ name)

```cpp
var cursor_name = collaborator_cursors[i].getElementsByClassName("kix-cursor-name")
```

### Potential Solution

- Right now, since the google doc uses canvas-based rendering, we are not able to select the texts through “span” elements anymore. In fact, we can no longer use these approaches by obtaining text information in dom tree. (See canvas elements below)

![Untitled](CollabAlly%20Project%20Report%2023f505c1b5a646178e3e265be1973d47/Untitled.png)

- Fortunately,  we can use google doc api to crawl the text information within canvas element, we can also obtain their position in doc as well, here is the code demo below:

```python
from __future__ import print_function

import os.path

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# If modifying these scopes, delete the file token.json.
SCOPES = ['https://www.googleapis.com/auth/documents.readonly']

# The ID of a sample document.
DOCUMENT_ID = '15m_x1PDQwDizhNghey478AJzn61RNEI3cT-nv4rRwcE'

def main():
    """Shows basic usage of the Docs API.
    Prints the title of a sample document.
    """
    creds = None
    # The file token.json stores the user's access and refresh tokens, and is
    # created automatically when the authorization flow completes for the first
    # time.
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)
    # If there are no (valid) credentials available, let the user log in.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                'credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
        # Save the credentials for the next run
        with open('token.json', 'w') as token:
            token.write(creds.to_json())

    try:
        service = build('docs', 'v1', credentials=creds)

        # Retrieve the documents contents from the Docs service.
        document = service.documents().get(documentId=DOCUMENT_ID).execute()
        # print(document)
        print('The title of the document is: {}'.format(document.get('title')))
        # print('The body of the document is: {}'.format(document['body']['content']))
        for s in document['body']['content']:
            if 'paragraph' in s.keys():# and 'textrun' in s['paragraph']['elements'][0].keys():
                x = s['paragraph']['elements'][0]['textRun']['content']
                if x.startswith('\n'):
                    continue
                print(x)
                print(s)
            else:
                x = None
            # print(s)
            print("----")
    except HttpError as err:
        print(err)

if __name__ == '__main__':
    main()
```

The output is as follows:

```python
The title of the document is: Codellab Ally Testing page…

The text is:  I love EECS

The text element is:
{'startIndex': 1, 'endIndex': 13, 'paragraph': {'elements': [{'startIndex': 1, 'endIndex': 13, 'textRun': {'content': 'I love EECS\n', 'textStyle': {}}}], 'paragraphStyle': {'namedStyleType': 'NORMAL_TEXT', 'direction': 'LEFT_TO_RIGHT'}}}

The text is:  Human AI Lab

The text element is:
{'startIndex': 17, 'endIndex': 30, 'paragraph': {'elements': [{'startIndex': 17, 'endIndex': 30, 'textRun': {'content': 'Human AI Lab\n', 'textStyle': {}}}], 'paragraphStyle': {'namedStyleType': 'NORMAL_TEXT', 'direction': 'LEFT_TO_RIGHT'}}}

The text is:  Let’s coding

The text element is:
{'startIndex': 33, 'endIndex': 46, 'paragraph': {'elements': [{'startIndex': 33, 'endIndex': 46, 'textRun': {'content': 'Let’s coding\n', 'textStyle': {}}}], 'paragraphStyle': {'namedStyleType': 'NORMAL_TEXT', 'direction': 'LEFT_TO_RIGHT'}}}
```

Corresponding page:

![Untitled](CollabAlly%20Project%20Report%2023f505c1b5a646178e3e265be1973d47/Untitled%201.png)

- Right now, the scripts are in python and probably we can embed it in to backend and our extension can use javascript to request the information with Restful API.
- With the updated texts and position, we can update the specific dictionary in our codes, including docHTMLContextJSON dictionary and docHTMLElementMap.
- Another solution is to apply google doc api in javascript, but setup is a bit trickier here. But the advantage is that it can greatly reduce latency

### Conclusion

After carefully examining the codes as well as having discussion with project contributors, I found the mainly adjustment we need to carry out is on chrome-extension part, which is mainly developed with javascript. The issue is that the codes can no longer crawl text information in google doc pages since they are now embed into canvas elements. Other part of codes including collaborators, comments still work well since we can still crawl those information. Fortunately, we can use google doc API to access these texts information and then update specific dictionary to make it works. This is really an interesting projects and I feel like the ideas are really novel. It is also very meaningful since it can greatly help blind users to collaborate. I will make every users to make this projects alive and further improve this.

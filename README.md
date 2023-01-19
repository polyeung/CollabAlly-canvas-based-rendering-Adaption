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

### Potential Solution

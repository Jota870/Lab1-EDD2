# LAB1-EDD2-MULTIBRANCH-V.0.8 VERSION - EJ

## Folder Structure:
Lab1-EDD2-main/
├── assets/
│   └── images / videos / audio
├── js/
│   ├── controller/
│   |   └── GameController.js
│   ├── data/
│   |   └── missions.js
│   ├── model/
│   |   └── graph.js
│   |   └── tree.js
│   ├── multiplayer/
│   |   |── attacker/
│   |   |   |── controller/
│   |   |   |   └── AttackerController.js
│   |   |   |── view/
│   |   |   |   └── AttackManager.js
│   |   |   |── view/
│   |   |   |   └── AttackerUI.js
│   |   └── NetworkManager.js
│   ├── sound/
│   |   └── SoundController.js
│   ├── view/
│   |   |── GraphRenderer.js
│   |   └── UIRenderer.js
│   └── main.js
├── server/
│   ├── node_modules/
│   |   ├── package-lock.json
│   |   ├── package.json
│   |   └── ws/
│   └── server.js
├── index.html
└── style.css

### CLASS EXPLANATIONS:
    **1. SERVER.JS**
    * Server.JS is the base code that implements the communication between the sessions which have either a detective or an attacker.
    * It's used mainly to send and receive info via console log or message payloads, as well as manage the current session.
    * It manages part of the timer as well, as sending information about any specific action taken. It also manages the display of what info will be sent between both.
    * It's based upon 3 key fragments: UTILITIES, STATE and CONNECTION HANDLER.
    *    * UTILITIES: Implements helper functions for sending payloads, broadcasting the session list, and getting the attackers in the session.
    *    * STATE: Sets the base variables to track the amount of total sessions, as well as the port used and the current total amount of attackers.
    *    * CONNECTION HANDLER: Implements the WebSocket server's logs, of which there are a few types of possible connections.

    **2. NETWORK MANAGER**
    * NetworkManager.js defines the function usage created in server.js, by defining the possible payloads that can be sent through it's msg system. 
    * It is handled at the level of the session, as it is called by both the game controller upon receiving actions.
    * It's based upon 4 key fragments: CONNECTION, SEND, EVENT LISTENER API, CONVENIENCE SENDERS:
    *    * CONNECTION: Creates the server and lists the functions defined for opening and closing it.
    *    * SEND: Defines the function prototype of how the send will work.
    *    * EVENT LISTENER: Defines the functions for listening to events.
    *    * CONVINIENCE SENDERS: List the definitions of constantly called send payloads.
    

### How to Test:
1.  Start the server: `node server.js`
2.  Open **two** browser tabs (on localhost:3000).
3.  **Tab 1 (Detective)**: Play as normal.
4.  **Tab 2 (Attacker)**: Press "k" inside the main menu, you should be able to write redacted in a prompt that comes up.
5.  **Lobby**: You should see the Detective's session in the list.
6.  **Infiltration**: Click the session to join.
7.  **Attack**: You can now click the buttons in the sidebar to trigger attacks on the Detective's graph instantly.
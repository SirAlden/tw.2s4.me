# tw.2s4.me Server

The original production code has been adapted to be runnable by a wider variety of willing instance operators for TWR (Textwall Ripoff). Contributions are welcome.
This version incorporates better DDoS protection by limiting the amount of edits sent to the server at once, while still allowing for massive edits using a caching system.
The server now only sends refreshes 10 times a second.
If someone is to send more than 40 chunk edit packets per second, the server will disconnect you. (Note a chunk is a small set of cells)


## Prerequisites
1. Node.js (preferrably >= v20)

## Instructions
1. Clone the repo
2. Run `npm install` in the repository directory
3. Go over settings.json in the data/ directory and update as needed
4. Run `cd src` and then `node server.js`
5. The `textwall` account will need to be created manually, so make sure nobody else can register it before you can

## General information
- The client code was directly taken from textwall.cc
- tw.2s4.me was created following its temporary shutdown in 2023
- The server code was written from scratch based on acquired knowledge of the protocol

## License
MIT

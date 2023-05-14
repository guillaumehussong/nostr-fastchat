import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { ChatMessage, ChatRelayMessage, SystemNotice, User, WsMessage } from '@websocket/types';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { generatePrivateKey,getPublicKey,  validateEvent, verifySignature, signEvent, getEventHash, relayInit, SimplePool} from 'nostr-tools';

@Injectable()
export class AppService {

  user$ = new BehaviorSubject<User>(undefined)
  socket: WebSocketSubject<WsMessage>
  chatMessage$ = new Subject<ChatRelayMessage>()
  systemNotice$ = new Subject<SystemNotice>()
  userList$ = new BehaviorSubject<User[]>([])
  privateKey = '58d634bf995d7ed91639df7e05fa5c6ac6c0770207199e947a5b86fd5922b184' || generatePrivateKey();
  publicKey = getPublicKey(this.privateKey);
  relay = relayInit('wss://nostr.wine')
  pool = new SimplePool()

  relays = ['wss://nostr.wine', 'wss://nostr.debancariser.com', ' wss://eden.nostr.land', ' wss://relay.damus.io' ]


  connect(name: string) {

    console.log("private key = " + this.privateKey);
    console.log("public key = " + this.publicKey);

    this.socket = webSocket(`ws://localhost:8080?name=${name}`)
    this.socket.subscribe(message => this.onMessageFromServer(message))
  }

  send(contents: string) {

    const event = {
      id: '',
      kind: 1,
      created_at: Math.floor(Date.now() / 1000),
      tags: [],
      content: contents,
      pubkey: getPublicKey(this.privateKey),
      sig: ''
    }

  /*   this.pubs = this.pool.publish(relays, newEvent)

    this.pubs.on('ok', () => {
      // this may be called multiple times, once for every relay that accepts the event
      // ...
    }) */

    event.id = getEventHash(event)
    event.sig = signEvent(event, this.privateKey)

    validateEvent(event)
    verifySignature(event)
    console.log('event', event)
    this.relay.on('connect', () => {
      console.log(`connected to ${this.relay.url}`)
    })
    this.relay.on('error', () => {
      console.log(`failed to connect to ${this.relay.url}`)
    })

    this.relay.connect()

    // let's query for an event that exists
    const sub = this.relay.sub([
      {
        ids: [event.id]
      }
    ])
    console.log('subscribed to', sub)
    sub.on('event', event => {
      console.log('we got the event we wanted:', event)
    })
    sub.on('eose', () => {
      console.log('eose', event)
      sub.unsub()
    })

    const chatMsg: ChatMessage = {
      event: 'chat',
      contents
    }
    this.socket.next(chatMsg)
  }

  onMessageFromServer(message: WsMessage) {
    console.log('From server:', message)
    switch (message.event) {
      case 'login': {
        this.user$.next(message.user)
        break;
      }
      case 'chatRelay': {
        this.chatMessage$.next(message)
        break;
      }
      case 'systemNotice': {
        this.systemNotice$.next(message)
        break
      }
      case 'userList': {
        this.userList$.next(message.users)
        break
      }
    }
  }
}

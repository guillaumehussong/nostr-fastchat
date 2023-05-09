import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { ChatMessage, ChatRelayMessage, SystemNotice, User, WsMessage } from '@websocket/types';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { generatePrivateKey } from 'nostr-tools';
import { Connect } from '@nostr-connect/connect';
import { ConnectURI } from '@nostr-connect/connect';
import {RelayPool} from "nostr-relaypool";

@Injectable()
export class AppService {
  user$ = new BehaviorSubject<User>(undefined)
  socket: WebSocketSubject<WsMessage>
  chatMessage$ = new Subject<ChatRelayMessage>()
  systemNotice$ = new Subject<SystemNotice>()
  userList$ = new BehaviorSubject<User[]>([])
  sk: any = generatePrivateKey();
  // webPK: any = this.sk.publicKey;
  relays = [
    "wss://relay.damus.io",
    "wss://nostr.fmt.wiz.biz",
    "wss://nostr.bongbong.com",
  ];

  connect(name: string) {
    this.socket = webSocket(`ws://localhost:8080?name=${name}`)
    this.socket.subscribe(message => this.onMessageFromServer(message))
    this.connectNostr(name);
  }

  connectNostr(name: string) {

    const relayPool = new RelayPool(this.relays);

    const unsub = relayPool.subscribe(
      [
        {
          authors: [
            "32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245",
          ],
        },
        {
          kinds: [0],
          authors: [
            "0000000035450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245",
          ],
          relay: "wss://nostr.sandwich.farm",
        },
      ],
      this.relays,
      (event, isAfterEose, relayURL) => {
        console.log(event, isAfterEose, relayURL);
      },
      undefined,
      (events, relayURL) => {
        console.log(events, relayURL);
      }
    );

    relayPool.onerror((err, relayUrl) => {
      console.log("RelayPool error", err, " from relay ", relayUrl);
    });
    relayPool.onnotice((relayUrl, notice) => {
      console.log("RelayPool notice", notice, " from relay ", relayUrl);
    });

    // const connect = new Connect({ secretKey: this.sk, relay: 'wss://nostr.vulpem.com' });
    // connect.events.on('connect', ( walletPubkey:string ) => {
    //   console.log('connected with wallet: ' + walletPubkey);
    // });
    // this.connectNostrURI(name);
    // connect.init();
  }

  connectNostrURI(name: string) {
    const connectURI = new ConnectURI({
      target: 'webPK',
      relay: 'wss://nostr.vulpem.com',
      metadata: {
        name: name,
        description: 'lorem ipsum dolor sit amet',
        url: 'https://vulpem.com',
        icons: ['https://vulpem.com/1000x860-p-500.422be1bc.png'],
      },
    });

    const uri = connectURI.toString();
    console.log(uri);
  }

  send(contents: string) {
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

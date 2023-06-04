import { Component, OnInit } from '@angular/core';
import { ChatRelayMessage, SystemNotice, User } from '@websocket/types';
import { AppService } from './app.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { NgSwitch, NgSwitchCase, NgFor } from '@angular/common';

@Component({
    selector: 'websocket-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    standalone: true,
    imports: [NgSwitch, NgSwitchCase, MatFormFieldModule, MatInputModule, MatButtonModule, MatListModule, NgFor, MatCardModule]
})
export class AppComponent implements OnInit {
  title = 'I am Nostr on Angular';

  messages: ChatRelayMessage[] = []
  users: User[] = []
  currentUser: User

  constructor(private appService: AppService, private snackbar: MatSnackBar) {}

  ngOnInit() {
    this.appService.chatMessage$.subscribe(msg => this.messages = [...this.messages, msg])
    this.appService.user$.subscribe(user => this.currentUser = user)
    this.appService.systemNotice$.subscribe(notice => this.onSystemNotice(notice))
    this.appService.userList$.subscribe(list => this.users = list)
  }

  connect(userNameInput: HTMLInputElement) {
    const name = userNameInput.value

    this.appService.connect(name)
  }

  send(chatInput: HTMLInputElement) {
    this.appService.send(chatInput.value)
    chatInput.value = ''
  }

  onSystemNotice(notice: SystemNotice) {
    this.snackbar.open(notice.contents, undefined, { duration: 5000 })
  }
}

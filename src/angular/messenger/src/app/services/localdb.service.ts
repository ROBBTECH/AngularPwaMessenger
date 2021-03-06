/**
 *    Copyright 2018 Sven Loesekann
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
       http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */
import { Injectable } from '@angular/core';
import Dexie from 'dexie';
import { LocalContact } from '../model/localContact';
import { Message } from '../model/message';
import { LocalUser } from '../model/localUser';
import { Contact } from '../model/contact';

@Injectable( {
  providedIn: 'root'
} )
export class LocaldbService extends Dexie {
  contacts: Dexie.Table<LocalContact, number>;
  messages: Dexie.Table<Message, number>;
  users:    Dexie.Table<LocalUser, number>;

  constructor() {
    super( "LocaldbService" );
    this.version( 1 ).stores({
      contacts: '++id, name, base64Avatar, base64PublicKey, userId, ownerId',
      messages: '++id, fromId, toId, timestamp, text, send, received',
      users: '++id, createdAt, username, password, email, base64Avatar, userId'
    });
  }
  
  storeContact(contact: LocalContact): Promise<number> {
    return this.transaction('rw', this.contacts, () => this.contacts.put(contact, contact.id));
  }
  
  loadContacts(contact: Contact): Promise<LocalContact[]> {    
    return this.transaction('r', this.contacts, () => this.contacts
        .filter(con => con.ownerId === contact.userId)
        .sortBy('name'));
  }
  
  storeMessage(message: Message): Promise<number> {
    return this.transaction('rw', this.messages, () => this.messages.add(message));
  }
  
  updateMessage(message: Message): Promise<number> {
      return this.transaction('rw', this.messages, () => this.messages.update(message.id, message));
  }
  
  loadMessages(contact: Contact): Promise<Message[]> {
    return this.transaction('rw', this.messages, () => this.messages
            .filter(msg => (msg.toId === contact.userId || msg.fromId === contact.userId))
            .sortBy('timestamp')
//            .toArray()
            );
  }
 
  toSyncMessages(contact: Contact): Promise<Message[]> {
      return this.transaction('rw', this.messages, () => this.messages
              .filter(msg => msg.fromId === contact.userId)
              .filter(msg => !msg.send)
              .filter(msg => msg.timestamp === null || typeof msg.timestamp === "undefined")
              .toArray());     
  }
  
  storeUser(user: LocalUser): Promise<number> {
    return this.transaction('rw', this.users, () => this.users.add(user));
  }
  
  loadUser(user: LocalUser): Promise<Dexie.Collection<LocalUser, number>> {
    return this.transaction('rw', this.users, () => this.users.filter(dbuser => dbuser.username === user.username));
  }
}

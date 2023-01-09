import { ApiService } from '@/shared/services/api.service';
import { AppService } from '@/shared/services/app.service';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HubConnection, HubConnectionBuilder } from '@aspnet/signalr';
import { environment } from 'environments/environment';
import { Guid } from 'guid-typescript';
@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit{

  loggedInUserId =localStorage.getItem("userId")
  users:any;
  chatUser:any;
  container:any;
  loginFullName = localStorage.getItem("userName")
  isLoginUserRole =localStorage.getItem("roleName");
  isLoginUserName =localStorage.getItem("email");
  typingMessages=false;
  notificationMessagesCount:any;
  messages: any[] = [];
  notificationValue:number=0;
  isNotification:boolean=false;
  displayMessages: any[] = []
  message: string
  hubConnection: HubConnection;


  connectedUsers: any[] = []
  constructor(private router: Router, private service: AppService, private messageService: ApiService) { }

  ngOnInit() {
     this.messageService.getUserReceivedMessages(this.loggedInUserId).subscribe((item:any)=>{
       if(item){
         this.messages=item;
         this.messages.forEach(x=>{
          x.type=x.receiver===this.loggedInUserId?'recieved':'sent';
         })
         console.log(this.messages);
       }
     })

    this.service.getAll().subscribe((user:any) => {
        if(user.data){
          if(this.isLoginUserRole=="Client"){

            this.users=user?.data.filter(x=>x.id!==this.loggedInUserId && x.roleName!="Client");
          }
          else{
              this.users=user?.data.filter(x=>x.id!==this.loggedInUserId);
          }
        this.makeItOnline();
        }
      },
      err => {
        console.log(err);
      },
    );




    this.message = ''
    this.hubConnection = new HubConnectionBuilder().withUrl(environment.chatHubUrl).build();
    const self = this
    this.hubConnection.start()
      .then(() => {
        self.hubConnection.invoke("PublishUserOnConnect", this.loggedInUserId, this.loginFullName, this.isLoginUserName)
          .then(() => console.log('User Sent Successfully'))
          .catch(err => console.error(err));

        this.hubConnection.on("BroadcastUserOnConnect", Usrs => {
          this.connectedUsers = Usrs;
          this.makeItOnline();
        })
        this.hubConnection.on("BroadcastUserOnDisconnect", Usrs => {
          this.connectedUsers = Usrs;
          this.users.forEach(item => {
            item.isOnline = false;
          });
          this.makeItOnline();
        })
      })
      .catch(err => console.log(err));


    this.hubConnection.on('BroadCastDeleteMessage', (connectionId, message) => {
     let deletedMessage=this.messages.find(x=>x.id===message.id);
     if(deletedMessage){
       deletedMessage.isReceiverDeleted=message.isReceiverDeleted;
       deletedMessage.isSenderDeleted=message.isSenderDeleted;
       if(deletedMessage.isReceiverDeleted && deletedMessage.receiver===this.chatUser.id){
        this.displayMessages = this.messages.filter(x => (x.type === 'sent' && x.receiver === this.chatUser.id) || (x.type === 'recieved' && x.sender === this.chatUser.id));
       }
     }

    })

    this.hubConnection.on('ReceiveDM', (connectionId, message) => {
      message.type = 'recieved';
      this.messages.push(message);
      let curentUser = this.users.find(x => x.id === message.sender);
      this.chatUser = curentUser;
      var user = this.users.find(x => x.id == this.chatUser.id);

      this.isNotification = true;
      this.displayMessages = this.messages.filter(x => (x.type === 'sent' && x.receiver === this.chatUser.id) || (x.type === 'recieved' && x.sender === this.chatUser.id));
      this.notificationMessagesCount = this.messages.filter(x => (x.type === 'sent' && x.receiver === this.chatUser.id && x.isNew===true) || (x.type === 'recieved' && x.sender === this.chatUser.id && x.isNew===true));

      for(let x=0;x<=this.notificationMessagesCount.length;x++){
        if(((this.notificationMessagesCount[x]?.sender===this.users[x].id || this.notificationMessagesCount[x]?.receiver===this.users[x].id) && this.notificationMessagesCount[x]?.isNew===true)){
          this.notificationValue = this.notificationValue + 1 ;
        }
      }




    })

    // this.hubConnection.on('ReceiveTP', (connectionId, message) => {
    //   message.type = 'typing';
    //   // this.messages.push(message);
    //   let curentUser = this.users.find(x => x.id === message.sender);
    //   this.chatUser = curentUser;
    //   var user = this.users.find(x => x.id == this.chatUser.id);
    //   this.typingMessages =true;
    //   setTimeout(() => {
    //     this.typingMessages = false;
    //   }, 2000)
    // })

  }


  typingMessage(){
    if (this.message != '' && this.message.trim() != '') {
      let guid=Guid.create();
      var msg = {
        id:guid.toString(),
        sender: this.loggedInUserId,
        receiver: this.chatUser.id,
        messageDate: new Date(),
        type: 'typing',
        content: 'null'
      };
      this.hubConnection.invoke('TypingMessageToUser', msg)
        .then(() => console.log('Typing'))
        .catch(err => console.error(err));
    }
  }
  SendDirectMessage() {
    if (this.message != '' && this.message.trim() != '') {
      let guid=Guid.create();
      var msg = {
        id:guid.toString(),
        sender: this.loggedInUserId,
        receiver: this.chatUser.id,
        messageDate: new Date(),
        type: 'sent',
        content: this.message
      };
      this.messages.push(msg);
      this.displayMessages = this.messages.filter(x => (x.type === 'sent' && x.receiver === this.chatUser.id) || (x.type === 'recieved' && x.sender === this.chatUser.id));

      this.hubConnection.invoke('SendMessageToUser', msg)
        .then(() => console.log('Message to user Sent Successfully'))
        .catch(err => console.error(err));
      this.message = '';


    }
  }

  openChat(user) {

    this.chatUser = user;
    this.displayMessages = this.messages.filter(x => (x.type === 'sent' && x.receiver === this.chatUser.id) || (x.type === 'recieved' && x.sender === this.chatUser.id));;
    this.hubConnection.on('ReceiveTP', (connectionId, message) => {
      message.type = 'typing';
      let curentUser = this.users.find(x => x.id === message.sender);
      this.chatUser = curentUser;
      // var user = this.users.find(x => x.id == this.chatUser.id);
      this.typingMessages =true;
      setTimeout(() => {
        this.typingMessages = false;
      }, 2000)
      })
      this.isNotification=false;
    // if(this.isNotification===true){
  //  for(let msgitem=0;msgitem<=this.displayMessages.length;msgitem++){
  //     if(this.displayMessages[msgitem]?.isNew===true){

  //       this.hubConnection.invoke('IsNotificationViewed', this.displayMessages[msgitem])
  //       .then(() => console.log('Is New update'))
  //       .catch(err => console.error(err));
  //     }
  //  }
  // }
  }

  makeItOnline() {
    if (this.connectedUsers && this.users) {
      this.connectedUsers.forEach(item => {
        var u = this.users.find(x => x.userName == item.username);
        if (u) {
          u.isOnline = true;
        }
      })
    }
  }
  deleteMessage(message,deleteType,isSender){
    let deleteMessage={
      'deleteType':deleteType,
      'message':message,
      'deletedUserId':this.loggedInUserId
    }
    this.hubConnection.invoke('DeleteMessage', deleteMessage)
        .then(() => console.log('publish delete request'))
        .catch(err => console.error(err));
    message.isSenderDeleted=isSender;
    message.isReceiverDeleted=!isSender;
  }

  onLogout() {
    this.hubConnection.invoke("RemoveOnlineUser", this.loggedInUserId)
      .then(() => {
        this.messages.push('User Disconnected Successfully')
      })
      .catch(err => console.error(err));
    localStorage.removeItem('token');
    this.router.navigate(['/user/login']);
  }

}

using OnlineEnergyUtilityPlateformAPI.DBModels.DTO;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using OnlineEnergyUtilityPlateformAPI.DBModels.Interface;
using System.Linq;
using OnlineEnergyUtilityPlateformAPI.DBModels.Model;
using OnlineEnergyUtilityPlateformAPI.Context;

namespace OnlineEnergyUtilityPlateformAPI
{

    public class ChatHub : Hub
        {
        private readonly ApplicationDbContext _context;
        public ChatHub(ApplicationDbContext context)
            {
            _context = context;
        }
            static IList<UserConnection> Users = new List<UserConnection>();

            public class UserConnection
            {
                public string UserId { get; set; }
                public string ConnectionId { get; set; }
                public string FullName { get; set; }
                public string Username { get; set; }
                public string Email { get; set; }
            }

            public Task SendMessageToUser(Message message)
            {


            var reciever = Users.FirstOrDefault(x => x.UserId == message.Receiver);
            var connectionId = reciever == null ? "offlineUser" : reciever.ConnectionId;
            message.IsNew = true;
            _context.Messages.Add(message);
            _context.SaveChanges();
            return Clients.Client(connectionId).SendAsync("ReceiveDM", Context.ConnectionId, message);
            }  
            public Task IsNotificationViewed(Message message)
            {


            var reciever = Users.FirstOrDefault(x => x.UserId == message.Receiver);
            var connectionId = reciever == null ? "offlineUser" : reciever.ConnectionId;
            message.IsNew = false;
            _context.Messages.Update(message); 
            _context.SaveChanges();
            return Clients.Client(connectionId).SendAsync("ReceiveDM", Context.ConnectionId, message);
            }
        public Task TypingMessageToUser(Message message)
        {


            var reciever = Users.FirstOrDefault(x => x.UserId == message.Receiver);
            var connectionId = reciever == null ? "offlineUser" : reciever.ConnectionId;
            return Clients.Client(connectionId).SendAsync("ReceiveTP", Context.ConnectionId, message);
        }


        public async Task DeleteMessage(MessageDeleteModel message)
            {
            var deleteMessage = _context.Messages.Where(x => x.Id == message.Message.Id).FirstOrDefault();
            _context.Messages.Remove(deleteMessage);
            await _context.SaveChangesAsync();
            await Clients.All.SendAsync("BroadCastDeleteMessage", Context.ConnectionId, deleteMessage);
        }

            public async Task PublishUserOnConnect(string id, string fullname, string username)
            {

                var existingUser = Users.FirstOrDefault(x => x.Username == username);
                if (existingUser == null)
                {
                    existingUser = Users.FirstOrDefault(x => x.Email == username);
                }

            var indexExistingUser = Users.IndexOf(existingUser);
            UserConnection user = new UserConnection
            {

                UserId = id,
                ConnectionId = Context.ConnectionId,
                FullName = fullname,
                Username = username
            };

            if (!Users.Contains(existingUser))
            {
                Users.Add(user);

            }
            else
            {
                Users[indexExistingUser] = user;
            }

            await Clients.All.SendAsync("BroadcastUserOnConnect", Users);

            }


        public IList<UserConnection> PublishUserOnConnect2(string id, string fullname, string username)
        {

            var existingUser = _context.Users.FirstOrDefault(x => x.UserName == username);
            if (existingUser == null)
            {
                existingUser = _context.Users.FirstOrDefault(x => x.Email == username);
            }


            int indexExistingUser = _context.Users.ToList().IndexOf(existingUser);
            UserConnection user = new UserConnection
            {

                UserId = id,
                ConnectionId = Context.ConnectionId,
                FullName = fullname,
                Username = username
            };

            if (!_context.Users.Contains(existingUser))
            {
                Users.Add(user);

            }
            else
            {
                Users.Add(user);
            }

            return Users;

        }
        public void RemoveOnlineUser(string userID)
            {
                var user = Users.Where(x => x.UserId == userID).ToList();
                foreach (UserConnection i in user)
                    Users.Remove(i);

                Clients.All.SendAsync("BroadcastUserOnDisconnect", Users);
            }
        
    }
}

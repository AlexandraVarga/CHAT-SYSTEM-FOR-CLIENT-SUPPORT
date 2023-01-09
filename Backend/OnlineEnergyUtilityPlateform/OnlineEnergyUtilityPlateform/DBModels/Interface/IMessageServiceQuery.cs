using Microsoft.DotNet.Scaffolding.Shared.Messaging;
using Nest;
using OnlineEnergyUtilityPlateformAPI.DBModels.DTO;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace OnlineEnergyUtilityPlateformAPI.DBModels.Interface
{
  

    public interface IMessageService
    {
        void Add(Message message);
        void Add(Model.Message message);
        Task<Message> DeleteMessage(MessageDeleteModel messageDeleteModel);
    }

   
}

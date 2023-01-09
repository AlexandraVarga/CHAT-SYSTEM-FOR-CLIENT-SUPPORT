using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Nest;
using OnlineEnergyUtilityPlateformAPI.Context;
using OnlineEnergyUtilityPlateformAPI.DBModels.DTO;
using OnlineEnergyUtilityPlateformAPI.DBModels.Interface;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace OnlineEnergyUtilityPlateformAPI.Controllers
{
    [Route("api/message")]
    [ApiController]
    public class MessageController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        public MessageController(ApplicationDbContext context)
        {
            _context = context;
        }
        [HttpGet]
        public IActionResult GetAll()
        {
            var messages = _context.Messages.OrderBy(c=>c.MessageDate).ToList();
            return Ok(messages);
        }


        [HttpGet("received-messages/{userId}")]
        public IActionResult GetUserReceivedMessages(string userId)
        {
            try
            {
                var messages = _context.Messages.Where(x => x.Receiver == userId).OrderBy(x => x.MessageDate).ToList();
                return Ok(messages);
            }
            catch (Exception ex)
            {

                throw;
            }
        }
        //[HttpPost()]
        //public async Task<IActionResult> DeleteMessage([FromBody] MessageDeleteModel messageDeleteModel)
        //{
        //    var message = aw);
        //    return Ok(message);
        //}
    }
}

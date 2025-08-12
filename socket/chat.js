const mongoose = require('mongoose');
const ObjectId = require("mongodb").ObjectId;
const Model = require('../model/index');
const { socketAuthMiddleware } = require('../middleware/socketAuth');

let users = [];

module.exports = (io, socket) => {

  const protectedEvents = ['join', 'newMessage', 'getChat', 'getChatMessages', 'leave', 'deleteMessage', 'online', 'offline', 'disconnect', 'archive-delete-chat', 'getEmployeesAndChats', 'getVendorAndChats'];

  socket.use((packet, next) => {
    if (protectedEvents.includes(packet[0])) {
      socketAuthMiddleware(['vendor', 'employee'])(socket, () => {
        next();
      });
    } else {
      next();
    }
  });

  socket.on("connect", async function () {
    try {

      socket.emit('join', {
        message: 'Welcome!',
        data: socket.user,

      });

    } catch (error) {
      console.error(error.message || error);
    }
  });

  socket.on("online", async function (data) {
    try {
      users.push({ userId: socket.user._id.toString(), is_online: true })
      io.emit('userStatus', { userId: socket.user._id.toString(), is_online: true });
      io.emit('onlineUsers', users);
    } catch (error) {
      console.error(error.message || error);
    }
  });

  socket.on("offline", async function (data) {
    try {
      const userIdToRemove = socket.user._id.toString()
      users = users.filter(user => user.userId !== userIdToRemove);
      io.emit('userStatus', { userId: userIdToRemove, is_online: false });
      io.emit('onlineUsers', users);
    } catch (error) {
      console.error(error.message || error);
    }
  });

  socket.on('disconnect', async function () {
    try {
      const userIdToRemove = socket.user._id.toString()
      users = users.filter(user => user.userId !== userIdToRemove);
      io.emit('userStatus', { userId: userIdToRemove, is_online: false });
      io.emit('onlineUsers', users);
       Model.UserModel.findOneAndUpdate(
        { _id: userIdToRemove }, // Query object: find the member by their _id
        { $set: { roomId: null ,isOnline : false} } // Update object: set the roomId field
      );
       Model.EmployeeModel.findOneAndUpdate(
        { _id: userIdToRemove }, // Query object: find the member by their _id
        { $set: { roomId: null ,isOnline : false} } // Update object: set the roomId field
      );

    } catch (error) {
      console.error(error.message || error);
    }
  });

  socket.on("join", async function () {
    try {
      let id = socket.user._id;
      let socketId = socket.id;

      let userId = socket.user._id.toString();
      socket.join(userId);
      io.to(userId).emit('join', { message: "Socket joined", data: socket.user._id });
    } catch (error) {
      socket.emit('errorEvent', { message: error.message });
    }
  });

  socket.on("leave", async function () {
    try {
      const userIdToRemove = new ObjectId(socket.user._id);
      users = users.filter(user => !user.userId.equals(userIdToRemove));
      let userId = socket.user._id.toString();
      io.to(userId).emit('leave', { message: "Socket Left", data: socket.user._id });
      socket.leave(userId);
    } catch (error) {
      socket.emit('errorEvent', { message: error.message });
    }
  });

  socket.on("archive-delete-chat", async function (data) {
    try {
      let userId = socket.user._id;
      let conversation = await Model.ConversationModel.findOne({ _id: new ObjectId(data.id) });
      if (!conversation) {
        return socket.emit('errorEvent', { message: "Conversation not found" });
      }

      const userIsMember = conversation.members.some(member => member._id.equals(new ObjectId(userId)));
      if (!userIsMember) {
        return socket.emit('errorEvent', { message: "Sorry! You cannot proceed further." });
      }

      conversation = await Model.ConversationModel.findOneAndUpdate(
        { _id: new ObjectId(data.id) },
        { $set: { [data.key]: data.status } },
        { new: true }
      );

      const event = data.key === "is_deleted" ? 'delete-chat' : 'archive-chat';
      socket.emit(event, { data: conversation, message: "Data updated successfully." });
    } catch (error) {
      socket.emit('errorEvent', { message: error.message });
    }
  });

  socket.on("deleteMessage", async function (data) {
    try {
      let user = socket.user._id;
      let deletedMessage = await Model.MessagesModel.findOne({
        _id: new ObjectId(data.id),
        isDeletedBy: { $in: [new ObjectId(user)] }
      });

      if (!deletedMessage) {
        deletedMessage = await Model.MessagesModel.findOneAndUpdate(
          { _id: new ObjectId(data.id) },
          { $push: { isDeletedBy: user } },
          { new: true }
        );
      }
      socket.emit('messageDeleted', { deletedMessage });
    } catch (error) {
      console.log("error", error);
      socket.emit('errorEvent', { message: error.message });
    }
  });

  socket.on("getChat", async function () {
    try {
      let user = socket.user._id;
      let conversations = await Model.ConversationModel.find({
        members: { $elemMatch: { _id: new ObjectId(user) } },
        is_deleted: { $ne: true }
      })
        .select("_id members createdAt latestMessage is_deleted is_archived")
        .populate({
          path: 'latestMessage',
          select: '_id sender conversationId message createdAt type isDeletedBy offerStatus'
        });

      for (let conv of conversations) {
        const populatedMembers = [];
        for (let member of conv.members) {
          const Model = member.modelType === 'Users' ? Model.UserModel : Model.EmployeeModel;
          const doc = await Model.findOne({ _id: member._id })
            .select("name firstName lastName email profile is_online");
          populatedMembers.push(doc);
        }
        conv.members = populatedMembers;
      }

      socket.emit("chatList", { data: conversations });
    } catch (err) {
      console.error(err);
      socket.emit("errorEvent", { message: err.message });
    }
  });

  socket.on("newMessage", async function (data) {
    try {
      if (!socket.user || !socket.user._id) {
        return socket.emit("errorEvent", { message: "Unauthorized: No user info in socket" });
      }
      const receiverId = data.receiver;
      const messageText = data.message;
      const senderModelType = socket.user.userId ? 'employee' : 'user';
      const receiverModelType = senderModelType == 'employee' ? 'user' : 'employee';
      const senderId = socket.user._id;

      const senderModel = senderModelType === 'user' ? Model.UserModel : Model.EmployeeModel;
      const receiverModel = receiverModelType === 'user' ? Model.UserModel : Model.EmployeeModel;

      // Find sender and receiver documents
      const senderDoc = await senderModel.findById(senderId);
      const receiverDoc = await receiverModel.findById(receiverId);

      if (!senderDoc || !receiverDoc) {
        return socket.emit("errorEvent", { message: "Sender or receiver not found" });
      }

      // Find conversation with exactly these two members
      let conversation = await Model.ConversationModel.findOne({
        members: {
          $all: [
            { $elemMatch: { _id: new ObjectId(senderId), modelType: senderModelType } },
            { $elemMatch: { _id: new ObjectId(receiverId), modelType: receiverModelType } }
          ],
          $size: 2
        }
      });

      // Create conversation if none found
      if (!conversation) {
        conversation = await Model.ConversationModel.create({
          members: [
            { _id: senderId, modelType: senderModelType },
            { _id: receiverId, modelType: receiverModelType }
          ]
        });
      }
      let isSeen = false;
      if(receiverDoc.roomId == conversation._id.toString()){
        isSeen = true;
      }
      // Create new message
      const newMessage = await Model.MessagesModel.create({
        sender: { _id: senderId, modelType: senderModelType },
        conversationId: conversation._id,
        type: data.type ?? "TEXT",
        message: messageText ?? "",
        thumbnail: data.thumbnail ?? null,
        file: data.file ?? null,
        isSeen,
        isOneTimeMessage: data.isOneTimeMessage ?? "normal",
        product: data.product ? new ObjectId(data.product) : null,
        offerSubtype: data.offerSubtype ?? "",
        offerPeriod: data.offerPeriod ?? "",
        offerQuantity: data.offerQuantity ?? 0,
        offerAmount: data.offerAmount ?? 0,
        offerExpiryDate: data.offerExpiryDate ?? Date.now(),
        offerStatus: data.offerStatus ?? 'Pending'
      });
      // Update conversation latest message
      conversation.latestMessage = newMessage._id;
      await conversation.save();

      // Populate sender info for response
      const populatedSender = await senderModel.findById(senderId)
        .select("name firstName lastName email profile is_online")
        .lean();

      const response = {
        data: {
          ...newMessage.toObject(),
          sender: {
            _id: senderId,
            modelType: senderModelType,
            ...populatedSender
          }
        },
        type: newMessage.type,
        message: newMessage.message
      };

      // Emit to sender
      socket.emit('messageSent', { response });

      // Emit to receiver — assuming you have a way to get the receiver's socket ID or room
      // For example, if you joined rooms named by userId on connection:
      io.to(receiverId.toString()).emit('newMessage', { response });

    } catch (error) {
      console.error("newMessage error:", error);
      socket.emit('errorEvent', { message: error.message });
    }
  });

  socket.on("getChatMessages", async function (data) {
    try {
      const userId = socket.user._id;
      const { conversationId, page = 1, limit = 10 } = data;
      const skip = (page - 1) * limit;
      const conversation = await Model.ConversationModel.findOne({ _id: new ObjectId(conversationId) });

      if (!conversation) {
        return socket.emit("errorEvent", { message: "Conversation not found" });
      }

      // Populate members
      const populatedMembers = await Promise.all(
        conversation.members.map(async (member) => {
          const memberModel = member.modelType === 'user'
            ? Model.UserModel
            : Model.EmployeeModel;

            await memberModel.findOneAndUpdate(
              { _id: userId }, // Query object: find the member by their _id
              { $set: { roomId: conversation._id.toString() } } // Update object: set the roomId field
            );
            
          const doc = await memberModel.findOne({ _id: member._id })
            .select("name firstName lastName email profile is_online");

          return {
            id: member._id,
            modelType: member.modelType,
            ...doc?._doc
          };
        })
      );

      // Count and fetch messages
      const totalMessages = await Model.MessagesModel.countDocuments({
        conversationId: new ObjectId(conversationId),
        isDeletedBy: { $nin: [new ObjectId(userId)] }
      });

      const totalPages = Math.ceil(totalMessages / limit);

      const messages = await Model.MessagesModel.find({
        conversationId: new ObjectId(conversationId),
        isDeletedBy: { $nin: [new ObjectId(userId)] }
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      // Populate sender data
      const populatedMessages = await Promise.all(messages.map(async (message) => {
        const senderModel = message.sender.modelType === 'user'
          ? Model.UserModel
          : Model.EmployeeModel;

        const senderDoc = await senderModel.findOne({ _id: message.sender._id })
          .select("name firstName lastName email profile image is_online");

        let daysLeft = 0;
        if (message.offerExpiryDate) {
          const offerExpiryDate = new Date(message.offerExpiryDate);
          const today = new Date();
          if (today < offerExpiryDate) {
            daysLeft = Math.ceil((offerExpiryDate - today) / (1000 * 60 * 60 * 24));
          }
        }

        return {
          data: {
            ...message.toObject(),
            sender: {
              _id: message.sender._id,
              modelType: message.sender.modelType,
              ...senderDoc?._doc
            }
          },
          message: message.message,
          type: message.type,
          daysLeft
        };
      }));

      // Mark other user's messages as seen
      await Model.MessagesModel.updateMany(
        {
          'sender._id': { $ne: new ObjectId(userId) },
          conversationId: new ObjectId(conversationId),
          isSeen: false
        },
        { $set: { isSeen: true } }
      );

      socket.emit("messageList", {
        data: populatedMessages,
        members: populatedMembers,
        currentPage: page,
        totalPages,
        totalMessages
      });

    } catch (error) {
      console.error("getChatMessages error:", error);
      socket.emit('errorEvent', { message: error.message });
    }
  });

  socket.on("getEmployeesAndChats", async function () {
    try {
      const vendorId = socket.user._id;

      // Get all employees for this vendor
      const employees = await Model.EmployeeModel.find({ userId: new ObjectId(vendorId) })
        .select("name firstName lastName email profile is_online");

      const responseList = [];

      for (let employee of employees) {
        // Check if a conversation exists between vendor and this employee
        const conversation = await Model.ConversationModel.findOne({
          $and: [
            { members: { $elemMatch: { _id: new ObjectId(vendorId), modelType: 'user' } } },
            { members: { $elemMatch: { _id: new ObjectId(employee._id), modelType: 'employee' } } },
            { members: { $size: 2 } },
            { is_deleted: { $ne: true } }
          ]
        })
          .select("_id members createdAt latestMessage is_deleted is_archived")
          .populate({
            path: 'latestMessage',
            select: '_id sender conversationId message createdAt type isDeletedBy offerStatus'
          });

        if (conversation) {
          // Populate both members of the conversation

          const unseenCount = await Model.MessagesModel.countDocuments({
            conversationId: conversation._id,
            'sender._id': { $ne: new ObjectId(vendorId) },
            isSeen: false
          });

          const populatedMembers = [];

          for (let member of conversation.members) {
            const model = member.modelType === 'user' ? Model.UserModel : Model.EmployeeModel;

            const doc = await model.findById(member._id).select("name firstName lastName email profile is_online");

            if (doc) {
              populatedMembers.push({
                ...doc.toObject(),
                modelType: member.modelType,
              });
            }
          }

          const conversationObj = conversation.toObject();
          conversationObj.members = populatedMembers;
          conversationObj.unseenCount = unseenCount
          responseList.push({
            type: 'conversation',
            data: conversationObj
          });

        } else {
          responseList.push({
            type: 'employee',
            data: employee.toObject()
          });
        }
      }

      socket.emit("employeesAndChatsList", { data: responseList });

    } catch (error) {
      console.error("getEmployeesAndChats error", error);
      socket.emit('errorEvent', { message: error.message });
    }
  });

  socket.on("getVendorAndChats", async function () {
    try {

      const employeeId = socket.user._id;
      const employeeDoc = await Model.EmployeeModel.findById(employeeId).select("userId");

      if (!employeeDoc || !employeeDoc.userId) {
        return socket.emit("errorEvent", { message: "Employee or linked vendor not found" });
      }

      const vendorId = employeeDoc.userId;
      const vendor = await Model.UserModel.findById(vendorId).select("name firstName lastName email profile is_online");

      const responseList = [];

      const conversation = await Model.ConversationModel.findOne({
        $and: [
          { members: { $elemMatch: { _id: new ObjectId(employeeId), modelType: 'employee' } } },
          { members: { $elemMatch: { _id: new ObjectId(vendorId), modelType: 'user' } } },
          { members: { $size: 2 } },
          { is_deleted: { $ne: true } }
        ]
      })
        .select("_id members createdAt latestMessage is_deleted is_archived")
        .populate({
          path: 'latestMessage',
          select: '_id sender conversationId message createdAt type isDeletedBy offerStatus'
        });

      if (conversation) {
        const populatedMembers = [];
        const unseenCount = await Model.MessagesModel.countDocuments({
          conversationId: conversation._id,
          'sender._id': { $ne: employeeId }, // <-- Corrected line
          isSeen: false
      });
        for (let member of conversation.members) {
          const model = member.modelType === 'user' ? Model.UserModel : Model.EmployeeModel;

          const doc = await model.findById(member._id).select("name firstName lastName email profile is_online");

          if (doc) {
            populatedMembers.push({
              ...doc.toObject(),
              modelType: member.modelType,
            });
          }
        }

        const conversationObj = conversation.toObject();
        conversationObj.members = populatedMembers;
        conversationObj.unseenCount = unseenCount
        responseList.push({
          type: 'conversation',
          data: conversationObj
        });

      } else {
        // No chat exists, return vendor info only
        responseList.push({
          type: 'vendor',
          data: vendor.toObject()
        });
      }

      socket.emit("vendorAndChatsList", { data: responseList });

    } catch (error) {
      console.error("getVendorAndChats error", error);
      socket.emit('errorEvent', { message: error.message });
    }
  });

};
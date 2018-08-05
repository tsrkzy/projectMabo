"use strict";

const {TokenModel} = require('../../schema/model/Token/Model');
const {ConnectionModel} = require('../../schema/model/Connection/Model');

export const joinToHandler = ({socket, nodeSocket, socketId, roomId, hash}: {
  socket,
  nodeSocket,
  socketId: string,
  roomId: string
  hash: string
}) => {
  socket.join(roomId, () => {
    console.log(` ---> ${socketId} joins to: ${roomId}`);
    nodeSocket.to(roomId).emit('joinInfo', `here comes: ${socketId}`);

    return new Promise((resolve, reject) => {

      /* get token */
      const query = TokenModel.find();
      query.collection(TokenModel.collection);
      query.where({hash, roomId});
      return query.exec()
        .then((tokenArray) => {
          const {_id: tokenId}: { _id: string } = tokenArray[0];

          /* insert connection and user */
          const newConnection = new ConnectionModel({
            roomId,
            socketId,
            tokenId,
            name: '',
          });
          return newConnection.save()
            .then((createdConnection) => {
              resolve(createdConnection);
            })
        })
        .catch((e) => {
          reject(e);
        })
    })
  });
};

"use strict";
const { slg } = require('../../util/MaboLogger');

const { TokenModel } = require('../../schema/model/Token/Model');
const { UserModel } = require('../../schema/model/User/Model');

export const joinToHandler = ({ socket, nodeSocket, socketId, roomId, hash }: {
  socket,
  nodeSocket,
  socketId: string,
  roomId: string
  hash: string
}) => {
  socket.join(roomId, () => {
    slg.debug(` ---> ${socketId} joins to: ${roomId}, hash: ${hash}`)
    nodeSocket.in(roomId).emit('joinInfo', `here comes: ${socketId}`);
    nodeSocket.in(roomId).clients((e, clients) => {
      slg.debug(`in roomId: ${roomId}, members are [${clients}]`);
    })
    return new Promise((resolve, reject) => {
      /* get token */
      const query = TokenModel.find();
      query.collection(TokenModel.collection);
      query.where({ hash, roomId });
      return query.exec()
        .then((tokenArray) => {
          const { _id: tokenId }: { _id: string } = tokenArray[0];

          /* insert user */
          const newUser = new UserModel({
            roomId,
            socketId,
            tokenId,
            name: '',
          });
          return newUser.save()
            .then((createdUser) => {
              resolve(createdUser);
            })
        })
        .catch((e) => {
          reject(e);
        })
    })
  });
};

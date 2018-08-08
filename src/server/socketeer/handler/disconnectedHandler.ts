"use strict";
const { slg } = require("../../util/MaboLogger");

const { UserModel } = require("../../schema/model/User/Model");

export const disconnectedHandler = ({
  socket,
  nodeSocket,
}: {
    socket;
    nodeSocket;
  }) => {
  return new Promise((resolve, reject) => {
    const query = UserModel.deleteMany({ socketId: socket.id });
    return query.exec()
      .then(() => {
        resolve();
      })
      .catch(e => {
        reject(e);
      });
  }).catch(e => {
    slg.debug(e);
  });
};

const config = {
    db: {
      /* don't expose password or any sensitive info, done only for demo */
      host: "localhost",
      user: "root",
      password: '',
      database: "credit_approval_system",
      connectTimeout: 60000
    },
    listPerPage: 1000,
  };
  module.exports = config;
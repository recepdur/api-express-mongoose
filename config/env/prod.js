
module.exports = {
  PORT: 3001,
  DB_CONNECTION: 'mongodb://127.0.0.1:27017/crm-prod',
  ACCESS_TOKEN_SECRET: 'd45f1eead40d19350268e4f4d520251082293dbf1fc68e39c678b2bd410a6c5cfb4267faf6066d2812db95b020d26b3285be5334ff51068ebb4378dd6da27d91',
  REFRESH_TOKEN_SECRET: 'fb45294a920f62b768d356fbe814146424eb7b4bf9216b44bfd86f477cc99e09ef87d9a86dc181235576b4a576bd7f0abf369c2ec8dcfdfe0e3206f32469a7c5',
  ACCESS_TOKEN_EXPIRED_TIME: '1h',
  REFRESH_TOKEN_EXPIRED_TIME: '4h'
};

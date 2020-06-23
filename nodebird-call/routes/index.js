const express = require('express');
const axios = require('axios');

const router = express.Router();
const URL = 'http://localhost:8002/v1';

axios.defaults.headers.origin = 'http://localhost:8003';
// NOTE: 토큰을 발급받는 부분을 함수로 만들어 재사용
const request = async (req, api) => {
  try {
    if (!req.session.jwt) { // 세션에 토큰이 없으면
      const tokenResult = await axios.post(`${URL}/token`, {
        clientSecret: process.env.CLIENT_SECRET,
      });
      req.session.jwt = tokenResult.data.token; // 세션에 토큰 저장
    }
    return await axios.get(`${URL}${api}`, {
      headers: { authorization: req.session.jwt },
    }); // API 요청
  } catch (error) {
    console.error(error);
    if (error.response.status < 500) { // 410이나 419처럼 의도된 에러면 발생
      return error.response;
    }
    throw error;
  }
};

router.get('/mypost', async (req, res, next) => {
  try {
    const result = await request(req, '/posts/my');
    res.json(result.data);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.get('/search/:hashtag', async (req, res, next) => {
  try {
    const result = await request(
        req, `/posts/hashtag/${encodeURIComponent(req.params.hashtag)}`,
        );
    res.json(result.data);
  } catch (error) {
    if (error.code) {
      console.error(error);
      next(error);
    }
  }
});

router.get('/test', async (req, res, next) => {
  try {
    const result = await request(req, `${URL}/test`);
    return res.json(result.data);
  } catch (error) {
    console.error(error);
    return next(error);
  }
});

router.get('/', (req, res) => {
  res.render('main', { key: process.env.CLIENT_SECRET });
});

module.exports = router;

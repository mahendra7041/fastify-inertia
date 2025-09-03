const sessionConfig = {
  secret:
    process.env.SESSION_SECRET ||
    "a secret with minimum length of 32 characters",
  saveUninitialized: true,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24,
    secure: process.env.NODE_ENV === "production",
  },
};

export default sessionConfig;

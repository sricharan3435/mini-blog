import { Hono } from "hono";

type Bindings = {
  mini_blog_db: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/blogs", async(c) => {
  const blogs = await c.env.mini_blog_db
    .prepare("SELECT * FROM blogs")
    .all();

  return c.json(blogs);
});

export default app

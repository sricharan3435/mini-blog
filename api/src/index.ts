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

app.get("/blogs/:id", async (c) => {
  const id = c.req.param("id");

  const blog = await c.env.mini_blog_db
    .prepare("SELECT * FROM blogs WHERE id = ?")
    .bind(id)
    .first();

  if (!blog) {
    return c.json(
        {
          success: false,
          message: "Blog not found",
        },
        404
      );
  }  

  return c.json({
    success: true,
    blog,
  });
});  

app.post("/blogs", async (c) => {
  const body = await c.req.json();

  await c.env.mini_blog_db
    .prepare(
      "INSERT INTO blogs (title, content) VALUES (?, ?)"
    )
    .bind(body.title, body.content)
    .run();

  return c.json({
    message: "Blog created successfully",
  });
});


app.put("/blogs/:id", async (c) => {
  const id = c.req.param("id");

  const body = await c.req.json();

  const blog = await c.env.mini_blog_db
  .prepare("SELECT * FROM blogs WHERE id = ?")
  .bind(id)
  .first();

  if(!blog){
    return c.json(
      {
      success: false,
      message: "Blog not found",
    },
    404
  );
  }

  await c.env.mini_blog_db
    .prepare("UPDATE blogs SET title = ?, content = ? WHERE id = ?")
    .bind(body.title, body.content, id)
    .run();  

  return c.json({
    success: true,
    message: "Blog updated sucessfully",
  });
});

app.delete("/blogs/:id", async (c) => {
  const id = c.req.param("id");

  const blog = await c.env.mini_blog_db
  .prepare("SELECT * FROM blogs WHERE id = ?")
  .bind(id)
  .first();

  if(!blog){
    return c.json(
      {
        success: false,
        message: "Blog not found",
      },
      404
    );
  }

  await c.env.mini_blog_db
  .prepare("DELETE FROM blogs WHERE id = ?")
  .bind(id)
  .run();

  return c.json(
    {
      success: true,
      message: "Blog deleted successfully"
    }
  );

});

export default app

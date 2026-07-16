import { Hono } from "hono";
import { sign } from "hono/jwt";
import { verify } from "hono/jwt"; 

type Bindings = {
  mini_blog_db: D1Database;
  JWT_SECRET: string
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

  //Here we have to read the header sent by client
  const authHeader = c.req.header("Authorization");

  //Checks if the client sent the authHeader, if not stop
  if(!authHeader) {
    return c.json(
      {
        success: false,
        message: "Authorization header missing",
      },
      401
    );
  }

  //first we are using jwt in blogs cuz only logged-in users can create blogs

  //spliting the token cuz it contains some extra string "Bearer" like that but we only need token
  const token = authHeader.split(" ")[1];

  //verifying the token contains -> token, secret_key, hasing algo
  const payload = await verify(token, c.env.JWT_SECRET, "HS256");

  const body = await c.req.json();

  await c.env.mini_blog_db
    .prepare(
      "INSERT INTO blogs (title, content, user_id) VALUES (?, ?, ?)"
    )
    .bind(body.title, body.content, payload.id)
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



//Authenticatoin starts from here

app.post("/register", async(c) => {
  const body = await c.req.json();

  const user = await c.env.mini_blog_db
  .prepare("SELECT * FROM users WHERE email = ?")
  .bind(body.email)
  .first();

  if(user){
    return c.json(
      {
        success: false,
        message: "User already exists"
      },
      409
    );
  }

  await c.env.mini_blog_db
  .prepare("INSERT INTO users (name, email, password) VALUES(?, ?, ?)")
  .bind(body.name, body.email, body.password)
  .run();

  return c.json({
    success: true,
    message: "User registered successfully",
  });

});


app.post("/login", async(c) => {
  const body = await c.req.json();

  const user = await c.env.mini_blog_db
  .prepare("SELECT * FROM users WHERE email = ?")
  .bind(body.email)
  .first();

  if(!user){
    return c.json({
      success: false,
      message: "User not found"
    },
    404
  );
}

  if(body.password !== user.password){
    return c.json({
      success: false,
      message: "Invalid password"
    },
    401
  );
}

  const token = await sign(
    {
      id: user.id,
    },
    c.env.JWT_SECRET
  );

  return c.json({
    success: true,
    message: "Login Successful",
    token: token,
  });

});


export default app;

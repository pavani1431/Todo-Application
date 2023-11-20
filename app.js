const express = require("express");
const app = express();
app.use(express.json());
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

const initilaizerDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running At http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initilaizerDBAndServer();

const hasPriorityAndStatusProperty = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};
const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};
//API 1  :--list of all todos whose status is 'TO DO'
app.get("/todos/", async (request, response) => {
  //let data = null;
  let getListTodosQuery = null;
  const { search_q = "", priority, status } = request.query;
  //console.log(search_q, priority, status);

  switch (true) {
    case hasPriorityAndStatusProperty(request.query):
      getListTodosQuery = `
                SELECT 
                    * 
                FROM 
                    todo
                WHERE 
                    todo LIKE '%${search_q}%' AND
                    priority = '${priority}' AND
                    status = '${status}'`;
      break;
    case hasPriorityProperty(request.query):
      getListTodosQuery = `
                SELECT 
                    * 
                FROM 
                    todo
                WHERE 
                    todo LIKE '%${search_q}%' AND
                    priority = '${priority}'`;
      break;
    case hasStatusProperty(request.query):
      getListTodosQuery = `
                SELECT 
                    * 
                FROM 
                    todo
                WHERE 
                    todo LIKE '%${search_q}%' AND
                    status = '${status}'`;
      break;
    default:
      getListTodosQuery = `
                SELECT 
                    * 
                FROM 
                    todo
                WHERE 
                    todo LIKE '%${search_q}%'`;
  }
  const todosList = await db.all(getListTodosQuery);
  response.send(todosList);
});

//API-2 :--a specific todo based on the todo ID
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const { search_q = "", status = "", priority } = request.query;
  const getTodoBasedOnTodoId = `
    SELECT 
        * 
    FROM 
        todo 
    WHERE 
        id = ${todoId}    `;
  const todo = await db.get(getTodoBasedOnTodoId);
  response.send(todo);
});

//API 3 :-- Create a todo in the todo table

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const createTodoQuery = `
    INSERT INTO todo 
        (id,todo,priority,status) 
        VALUES ('${id}','${todo}','${priority}','${status}')`;
  const dbResponse = await db.run(createTodoQuery);
  response.send("Todo Successfully Added");
});

//API 4 :--Updates the details of a specific todo based on the todo ID
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const requestBody = request.body;
  let updateColumn = "";
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
  }
  const previousQuery = `
    SELECT 
        * 
    FROM 
        todo 
    WHERE 
        id = '${todoId}'`;

  const previousTodo = await db.get(previousQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;

  const updateTodoQuery = `
    UPDATE 
        todo
    SET 
        todo = '${todo}',
        priority = '${priority}',
        status = '${status}'
    WHERE  
        id = ${todoId} `;
  await db.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

//API 5:-- Deletes a todo from the todo table based on the todo ID
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    DELETE 
    FROM todo
    WHERE id = '${todoId}'`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;

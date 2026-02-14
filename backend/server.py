from fastapi import FastAPI

# 1. Create an instance of the FastAPI class
app = FastAPI()

# 2. Define a route (the path) and the HTTP method (get)
@app.get("/")
async def root():
    # 3. Return a dictionary (FastAPI converts this to JSON automatically)
    return {"message": "Hello World"}

@app.get("/items/{item_id}")
async def read_item(item_id: int):
    return {"item_id": item_id, "status": "found"}
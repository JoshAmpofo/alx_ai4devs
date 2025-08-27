# generating two simple REST APIs for GET/items and POST/items

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()

items = []

class Item(BaseModel):
    name: str
    description: str = None

@app.get("/items")
def get_items():
    return items

@app.post("/items")
def create_item(item: Item):
    items.append(item.dict())
    return item


# Generating GET/item and POST/item APIs using Chat option
# additional simple REST APIs for GET/item and POST/item
@app.get("/item")
def get_item(index: int = -1):
    if not items:
        raise HTTPException(status_code=404, detail="No items found")
    # Return the item at the given index; defaults to last item when index is out of range or negative
    if index < 0 or index >= len(items):
        index = -1
    return items[index]

@app.post("/item")
def create_single_item(item: Item):
    items.append(item.dict())
    return item

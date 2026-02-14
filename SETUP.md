# Alberto Setup instructions (feel free to use if you use uv)

**if you are pip you may have to manually figure out which packages to add**

setting up after cloning
```
uv sync
```
to add a package
```
uv add <package name>
```
running server
```
uv run uvicorn server:app --reload
```
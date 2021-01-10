# actions.mini-program

A [GitHub Action](https://github.com/features/actions) to integration Mini Program [dev, pub, preview...] with github action, make collaborative development easier

## Usage

You can use this action after any other action. Here is an example setup of this action:

1. Create a `.github/workflows/actions.yml` file in your GitHub repo.
2. Add the following code to the `actions.yml` file.

```yml
on: push
name: actions.mini-program
jobs:
  start:
    name: Start
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: actions.mini-program
      uses: actions.mini-program@main
```

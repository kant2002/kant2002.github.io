# Andrii Kurdyumov's personal blog

Як запустити цю диявольcку машину

```
docker run --rm --volume="${PWD}:/srv/jekyll:Z" --publish 4000:4000 jekyll/jekyll jekyll serve --force-polling
```

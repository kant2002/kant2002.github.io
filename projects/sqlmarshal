---
layout: page
title: AOT-дружня бібліотека для доступу до баз даних
permalink: /projects/openalex/
---

# SqlMarshal

Написана на сурс-генераторах, ця бібліотека спрямована бути дуже маленьким прошарком над ADO.NET.

Приклад праці із збереженими процедурами.

```
public class PersonInformation
{
    public int PersonId { get; set; }

    public string? PersonName { get; set; }
}

public partial class DataContext
{
    private DbConnection connection;

    public DataContext(DbConnection connection) => this.connection = connection;

    [SqlMarshal("persons_list")]
    public partial IList<PersonInformation> GetPersons();

    [SqlMarshal]
    public partial IList<PersonInformation> GetPersonFromSql([RawSql]string sql, int id);
}
```

Якщо цікаво можна подивитися на [ісходний код](https://github.com/kant2002/SqlMarshal) або скачати [Nuget](https://www.nuget.org/packages/SqlMarshal/)
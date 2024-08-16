﻿using AutoMapper;
using Database.Model;

namespace Resources;

public class ProgramRepository(DatabaseContext databaseContext, IMapper mapper) : IProgramRepository
{
    public ProgramResult Query(ProgramQuery programQuery)
    {
        var query = databaseContext.VSd_ProgramSet;
        if (programQuery.StateCode != null) query.Where(c => c.StateCode == mapper.Map<VSd_Program_StateCode>(programQuery.StateCode));
        
        var programs = mapper.Map<IEnumerable<Program>>(query.ToList());
        return new ProgramResult(programs);
    }
}

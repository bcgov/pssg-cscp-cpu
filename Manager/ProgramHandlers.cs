﻿using AutoMapper;
using Manager.Contract;
using MediatR;
using Resources;

namespace Manager;

public class ProgramHandlers(IProgramRepository programRepository, IMapper mapper) : IRequestHandler<Contract.ProgramQuery, Contract.ProgramResult>
{
    // TODO remove default cancellation token
    public async Task<Contract.ProgramResult> Handle(Contract.ProgramQuery programQuery, CancellationToken cancellationToken = default)
    {
        //var resourcesProgramQuery = mapper.Map<Resources.ProgramQuery>(programQuery);
        var resourcesProgramQuery = new Resources.ProgramQuery() { StateCode = (Resources.StateCode)(int)programQuery.StateCode };
        var programResults = programRepository.Query(resourcesProgramQuery);
        var programs = mapper.Map<IEnumerable<Contract.Program>>(programResults.Programs);
        return new Contract.ProgramResult(programs);
    }
}

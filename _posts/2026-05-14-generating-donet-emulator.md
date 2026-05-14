---
layout: post
title:  "Generating a .NET Emulator"
date:   2026-05-14 22:33:44 +0200
categories: en llm emulator
comments: true
---

<script type="module">
    import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
    mermaid.initialize({ startOnLoad: true, logLevel: 'trace' });
  document.querySelectorAll('pre > code.language-mermaid').forEach((codeBlock) => {
    codeBlock.parentElement.outerHTML = `<pre class="mermaid">${codeBlock.textContent}</pre>`;
  });
</script>

Hello LLM-users. I want to create an IL/.NET VM emulator, for example for malware sandboxing. I decided to do it this way: use fuzzing as a general quality control process for execution.

I see the following semi-automated emulator building processes:
- Progress monitoring process
- Implementation process
- Implementation validation process
- Bug fixing process
- Manual recovery process

The overall process can be visualized as follows:

<pre class="mermaid">
flowchart TD
    classDef llmTask fill:orange,stroke:#333,stroke-width:4px,color:#333;
    classDef llmGeneratedScript fill:lightGreen,stroke:#333,stroke-width:4px,color:black;
    classDef humanCode fill:green,stroke:#333,stroke-width:4px,color:white;
    START([Start])
    FINISH([End])

    %% General flow
    START --> Progress
    Progress -->|Implement new instruction| Impl 
    Progress -->|No unimplemented instructions| FINISH 
    Impl -->|Success| Validation
    Impl -->|Failed to implement| RecoveryProcess
    Validation -->|Errors found| BugFix
    BugFix -->|Success| Validation
    BugFix -->|Failed to implement| RecoveryProcess
    Validation -->|Success| Progress
    Validation -->|Failed to implement| RecoveryProcess
</pre>

<!--more-->

Progress Monitoring Process
1. I create manually, or through a simple LLM-generated script, a list of all IL instructions. This will be a manual checklist of what has been done.
For each instruction, in addition to the mnemonic, there will be a generated description of what it does. I don't plan to have a complex description, i.e., not the full spec of the instruction's behavior.
2. If all tests and fuzzing pass, I consider the instruction implemented and mark it in the checklist.

Implementation Process
1. The LLM receives as a prompt the instruction to be implemented and a description of the semantic behavior of that instruction.
2. For a smoke test, the generated prompt is executed on test projects. If everything passes successfully, the draft implementation is considered complete.
3. After completing this stage, the financial cost results must be recorded in a financial audit file via script.

Implementation Validation Process
1. I write manually a fuzzer that generates a sequence of IL instructions from the list of implemented or currently being implemented instructions.
The fuzzer checks the execution of the generated sequence on the emulator and on the standard .NET runtime. If anything differs, it's a failure.
This is registered, and a reduced test case is built from the generated sequence. This reduced test case will be recorded in a file in some programming language.
2. If the draft implementation has errors and a test case file is generated, this test case is added to the emulator's test project. Then the bug fixing phase is launched.
3. If the draft implementation has no errors, the current instruction implementation is considered successful, and we can select the next instruction for implementation.
4. After completing this stage, the financial cost results must be recorded in a financial audit file via script.

Bug Fixing Process
1. The LLM is instructed to fix all bugs found as a result of running the emulator's test project.
2. The process ends either after 10 iterations of attempts to fix errors or when all errors in the test project have been fixed.
3. After completing this stage, the financial cost results must be recorded in a financial audit file via script.
4. After this, the Implementation Validation Process must be restarted.

Manual Recovery Process
1. In case the execution of the task took a long time, as a safeguard, the system should stop working.
2. The system operator (me) must then figure out and document in the tracker the reason for the problem, what went wrong, of course if possible.

The entire process can be visualized as follows.

<pre class="mermaid">
flowchart TD
    classDef llmTask fill:orange,stroke:#333,stroke-width:4px,color:#333;
    classDef llmGeneratedScript fill:lightGreen,stroke:#333,stroke-width:4px,color:black;
    classDef humanCode fill:green,stroke:#333,stroke-width:4px,color:white;
    START([Start])
    FINISH([End])

    %% Progress control
    subgraph Progress["Progress Monitoring Process"]
        P1["Generate a list of all IL instructions<br/>(manually or via LLM script)"]:::llmGeneratedScript
        P2["For each instruction:<br/>- mnemonic<br/>- short description of behavior"]:::llmGeneratedScript
        P3{"All tests and fuzzing passed?"}
        P4["Mark instruction as implemented<br/>in checklist"]

        P1 --> P2 --> P3
        P3 -->|Yes| P4
    end

    %% Implementation
    subgraph Impl["Implementation Process"]
        I1["Pass to LLM:<br/>- instruction<br/>- semantic description"]
        I2["Run smoke tests<br/>on test projects"]:::llmTask
        I3{"Smoke tests successful?"}
        I4["Draft implementation complete"]
        I5["Record financial costs<br/>in financial audit file"]:::llmGeneratedScript

        I1 --> I2 --> I3
        I3 -->|Yes| I4 --> I5
    end

    %% Validation
    subgraph Validation["Implementation Validation Process"]
        V1["Fuzzer generates IL instruction sequence"]:::humanCode
        V2["Compare execution:<br/>- emulator<br/>- .NET runtime"]:::humanCode
        V3{"Any differences?"}
        V4["Register error"]:::humanCode
        V5["Build minimized test case"]:::humanCode
        V6["Write test case to file"]:::humanCode
        V7{"Draft implementation has errors?"}
        V8["Add test case<br/>to emulator test project"]:::llmTask
        V9["Instruction implementation successful"]
        V10["Select next instruction"]:::llmTask
        V11["Record financial costs<br/>in financial audit file"]:::llmGeneratedScript

        V1 --> V2 --> V3

        V3 -->|Yes| V4 --> V5 --> V6 --> V7
        V3 -->|No| V7

        V7 -->|Yes| V8
        V7 -->|No| V9 --> V10 --> V11
    end

    %% Bug fix
    subgraph BugFix["Bug Fixing Process"]
        B1["LLM receives instruction<br/>to fix found bugs"]
        B2["Run fix iteration cycle"]:::llmTask
        B3{"All errors fixed?"}
        B4{"Reached 10 iterations?"}
        B5["Complete fix process"]
        B6["Record financial costs<br/>in financial audit file"]:::llmGeneratedScript
        B7["Return to implementation<br/>validation process"]
        B8{"All errors fixed?"}
        
        B1 --> B2 --> B3
        B3 -->|Yes| B5
        B3 -->|No| B4
        B4 -->|No| B2
        B4 -->|Yes| B5

        B5 --> B8 -->|Yes| B6 --> B7
        B8 -->|No| RecoveryProcess[Recovery Process]
    end

    %% General flow
    START --> Progress
    Progress -->|Implement new instruction| Impl 
    Progress -->|No unimplemented instructions| FINISH 
    Impl -->|Success| Validation
    Impl -->|Failed to implement| RecoveryProcess
    Validation -->|Errors found| BugFix
    BugFix -->|Success| Validation
    BugFix -->|Failed to implement| RecoveryProcess
    Validation -->|Success| Progress
    Validation -->|Failed to implement| RecoveryProcess
</pre>

[View in editor](https://mermaid.live/edit#pako:eNq1V21P6zYU_itWpitxpcLoO2TTnShc7ioBQreo00b5YBwn8XDszkmg0PLfd2znxUkLQ9OGkJIcn9fnOcd21x6RAfV8L-TyicRYZejmbCEQ_BGO0_SMhojz5AanDyhknPtSYRHRTpop-UD9H_r9fvG-_8SCLPYHy1WHSC6VWftp29U3KqjCGQ1mRLFlZr1yFsXZN0Wp-Ijne47JQ9t1nCdYnEIx1mP0UWdPMcto4Wx2c_L9Zu92lgEOd5-t7Hx6NZ39unf7VQRaZIWfPqFrJSFGmiIiBXjmdiHN7yOFl3G1fLvwKs1LKVgmFRORXiYgWnh31k7_XXdBuYQHYcRZmiEZIsw5ml4gJqCCnGRMivTne_Xjlz0oOIfFZyQVemQYXVxcotSg-hkc-76_DbcTrQfRzsGSYhK7zn3jfB8lgiaQMCk-01hCcwTUBgA9ndo9jfEjk-oD4frrhXcClWQ0zVKERYDC_OVFY7EEBmnwy8J7ddQHkN0lVg9uZginiCVLThMqIIRJjAlEYkoeNFgGTRdPtL__BQq1j76bjBZtfqfpBiJZORWBw-60DIN14Ba3ehHSa-rspHSqKb2G-lAmNT0ltk5RJbwU2MwYcRFuutJ8fc8FShNoYwujsYXQ-gMtlfyTkiytuNBD69hrAma1LZRDdL5hzpvQTzX0ZwqHWQ22rZBI_Z3RZl5DnRclUgGjTGBBGOagWqYHBNVinAfMjDx9u2Nc9AxzU0vgtO8WUxM4Hdjl4S4e55izYBeH9cI2k_XaTlLnmtRzaF6qUFRkn7YmFPj8K6eCFHVWm5PjRfN5CohiRRFdUZK7w0eTnGPYK4rPg6uvN0jl0CDJOx7NiIlnFLAwpEpHT5vUzgeGqwhmBXKnSpWTu8ub5nWSMx6ghAmWsBca2EYjOH0niRGY_aZgT62VdfPXnO8yGq_faLkYRt7k2a7kCMKcBE5GBikIVCLXGIo3ZmJ-rMl3WGtFr0ek1QCHYDejHDwjQVeZy_xbobrd_21O5nZO5nZO5v3GmjMpczsp86F9jOxjvKV8JTdG7BLkeDnakhuDY-uue1g8u7vmcZJHUNaqNYwgPWcr028Rgre3TsiJxlCfcooSyh5h6tobqem0FQplDgfMfR617Ms9VOtAi6piX3smDtBN3ibluWW7UFu2z6rJYK2ZhWMUJgTKrxy3enYyLCZe76EmheWuGkf_cZ9UjsfGcZYroQey2erG9WO97-3M7OgfoXCpMm0wsT056buI1r00GW7JdS9NBi66tbi3Ja68uDDbkEeOgm31ydgtpnKrwX6k6rnouNvyu2zBu12NbGHmSN-bncujvWoUFz4rr65_Ol510sC-8eR278bcKtAOkyuJcuFcexoXwU1xPy0MjQ9tNLM712brAKw0zjF0TdDohC0orIlzHGrDrwX7esQ2xehaRfv-fnxH519nUDlvAt3S-oh7r-NFigWeD4DSjpdQlWD96a21y4WXxVQfuD68BjTEOYeTZCFewWyJxR9SJqWlknkUe36IeQpf-RLyoGcMw_ZWq0ADUXUKsGWef2w8eP7aW3l-dzA4GHV7vd7weDQ-Ooa3jvcM4sPBwXh8NADJsKf_Xzvei4nZPRgdjkf93ng46vX7sNbxaKB_WlzaH3PmN93r3x0Vagw)


It's interesting what else could be added so the system remains understandable and manageable with minimal LLM loops. Because I believe that even so, it's very likely that in complex cases the system will break in unknown ways and will require manual fixing.
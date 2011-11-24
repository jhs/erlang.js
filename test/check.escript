#!/usr/bin/env escript

main([File])
    -> case file:read_file(File)
        of {ok, Bytes}
            -> try binary_to_term(Bytes)
                of Term
                    -> io:format("Got: ~p\n", [Term])
                catch error:badarg
                    -> io:format("~p\nFailed\n", [Bytes])
                end
        ; _
            -> io:format("Error reading file: ~s\n", [File])
        end
    ;

main(_)
    -> main(["/tmp/out"])
    .

% vim: sts=4 sw=4 et

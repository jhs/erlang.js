#!/usr/bin/env escript

main(_) -> ok
    , Port = list_to_integer(os:getenv("port"))
    , io:format(standard_error, "Listen :~w\n", [Port])
    , serve(Port)
    .

serve(Port) -> ok
    , case gen_tcp:listen(Port, [binary, {reuseaddr, true},
			       {packet, 0}, {active, false}]) of
	{ok, LSock} -> ok
	    , serve(Port, LSock)
	; Other -> ok
	    , io:format(standard_error, "Can't listen to socket ~p~n", [Other])
        end
    .

serve(Port, LSock) -> ok
    , case gen_tcp:accept(LSock)
        of {ok, Socket} -> ok
            , echo(Socket)
	; {error, Reason} -> ok
	    , io:format(standard_error, "Can't accept socket ~p~n", [Reason])
            , serve(Port, LSock)
        end
    .

echo(Socket) -> ok
    %, io:format(standard_error, "Listen ~p\n", [Socket])
    , echo(Socket, get_length)
    .

echo(Socket, get_length) -> ok
    , {ok, <<C1, C2, C3, C4, Data/binary>>} = recv(Socket)
    %, io:format(standard_error, "Received ~w_~w_~w_~w ~p\n", [C1, C2, C3, C4, Data])
    , Length = (C1*256*256*256) + (C2*256*256) + (C3*256) + C4
    , Remaining = Length - size(Data)
    , echo(Socket, Data, Remaining)
    .

echo(Socket, Data, 0) -> ok
    %, io:format(standard_error, "Got ~w of data: ~p\n", [size(Data), Data])
    , try binary_to_term(Data)
        of Term -> ok
            %, io:format(standard_error, "Got a term: ~w\n", [Term])
            , Repr = io_lib:format("~p\r\n", [Term])
            , Encoded = term_to_binary(Term)
            , gen_tcp:send(Socket, Repr)
            , gen_tcp:send(Socket, [Encoded])
            , gen_tcp:close(Socket)
            , ok
        catch error:badarg -> ok
            , throw({error, badarg})
        end
    .

recv(Socket) -> ok
    , inet:setopts(Socket, [binary, {packet, raw}, {active, once}])
    , receive
        {tcp_closed, Socket} -> ok
            %, io:format(standard_error, "Received all data\n", [])
            , {error, tcp_closed}
        ; {tcp, Socket, Msg} -> ok
            %, io:format(standard_error, "Received ~p\n", [Msg])
            , {ok, Msg}
        after 5000 -> ok
            %, io:format(standard_error, "Receive timeout\n", [])
            , {error, timeout}
        end
    .

% vim: sts=4 sw=4 et

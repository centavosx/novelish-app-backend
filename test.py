def highestNum(x,y,z):
    asc = x < 7
    final = x + 1 if asc else x - 1
    moves = 1
    print(final)
    while final != y:
        if moves % z == 0:
            asc = not asc
        
        final = final + 1 if asc and final + 1 < 7 else final - 1
        print(final)
        moves+=1
    return moves - 1

print(highestNum(8,5,3))
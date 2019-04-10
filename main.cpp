#include <stdlib.h>
#include "pxt.h"

using namespace std;

namespace Makercloud_Kitten {

    //%
    void setSerialBuffer(int size) {
        uBit.serial.setRxBufferSize(size);
        uBit.serial.setTxBufferSize(size);
    }
    
    
    
} // namespace Makercloud_Kitten

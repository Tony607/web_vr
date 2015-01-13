/**the compact version of Quaternion passing through the communication, which only use 4 bytes
to represent a quaternion*/
class QuaternionCompact {
    public:
        uint8_t w;
        uint8_t x;
        uint8_t y;
        uint8_t z;
        
        QuaternionCompact() {
            w = 254;
            x = 127;
            y = 127;
            z = 127;
        }
        QuaternionCompact(Quaternion quternion) {
			x = (uint8_t)((quternion.x+1)*127);
			y = (uint8_t)((quternion.y+1)*127);
			z = (uint8_t)((quternion.z+1)*127);
			w = (uint8_t)((quternion.w+1)*127);
        }
		bool isEqualTo(QuaternionCompact quternion){
			if(quternion.x == x && quternion.y == y && quternion.z == z && quternion.w == w){
				return true;
			}else{
				return false;
			}
		}

};
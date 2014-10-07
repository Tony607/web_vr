
int freeRam () {
	extern int __heap_start, *__brkval; 
	int v; 
	return (int) &v - (__brkval == 0 ? (int) &__heap_start : (int) __brkval); 
}



// 200ns => 4 instructions at 16Mhz
void delay_200ns()  
{
	__asm__ __volatile__ (
		"nop" "\n\t"
		"nop" "\n\t"
		"nop" "\n\t"
		"nop"); 
}
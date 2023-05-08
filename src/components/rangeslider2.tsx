import React from 'react'

export default function RangeSlider() {
    return (
        <>
            <div
                className="range-slider flat"
                data-ticks-position='top'
                // style='--min:-500; --max:500; --value-a:-220; --value-b:400; --suffix:"%"; --text-value-a:"-220"; --text-value-b:"400";'
            >
                <input
                    type="range"
                    min="-500"
                    max="500"
                    value="-220"
                // oninput="this.parentNode.style.setProperty('--value-a',this.value); this.parentNode.style.setProperty('--text-value-a', JSON.stringify(this.value))"
                />
                <output></output>
                <input
                    type="range"
                    min="-500"
                    max="500"
                    value="400"
                // oninput="this.parentNode.style.setProperty('--value-b',this.value); this.parentNode.style.setProperty('--text-value-b', JSON.stringify(this.value))"
                />
                <output></output>
                <div className='range-slider__progress'></div>
            </div>
        </>
    )
}
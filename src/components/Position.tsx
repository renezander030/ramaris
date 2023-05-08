import React, { useEffect, useState, useReducer, useRef } from "react";
import { trpc } from '../utils/trpc';
import useStore from '../store';
import { shortenAddress } from '../utils/shortenAddress';

export default function Position(position: any, index: any) {

    // position is passed as a property of position and this is the current best fix
    position = position.position;

    return (
        <div>
            {/* {JSON.stringify(position)} */}
            <div>{position.actionType}</div>
            <div>{position.symbol}</div>
            {/* <div>token addr {shortenAddress(position.tokenAddress)}</div> */}
            <div>size % {position.positionSizePercentage}</div>
            <div>sl % {position.stoplossPercentage}</div>
            <div>tp % {position.takeprofitPercentage}</div>
            <div>bot id {position.botId}</div>
            <div>timestamp {position.timestamp}</div>
        </div>
    );
};
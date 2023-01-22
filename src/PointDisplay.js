import React from 'react'

export default function PointDisplay(props) {
  const {points, transactions} = props.data

  return (
    <div>
        <h2>Total Points: {points ?? 0}</h2>
        <h2>Point Breakdown: </h2>
        <ul>
        {
            transactions
            &&
            transactions.map((transaction) => {
                return (
                    <li><b>{transaction}</b></li>
                )
            })
        }
        </ul>
    </div>
  )
}

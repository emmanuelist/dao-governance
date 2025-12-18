;; DAO Governance Contract
;; A complete DAO implementation with treasury management, proposals, and voting

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-member (err u101))
(define-constant err-proposal-not-found (err u102))
(define-constant err-already-voted (err u103))
(define-constant err-voting-ended (err u104))
(define-constant err-proposal-not-passed (err u105))
(define-constant err-proposal-already-executed (err u106))
(define-constant err-insufficient-balance (err u107))
(define-constant err-invalid-amount (err u108))
(define-constant err-voting-not-ended (err u109))

;; Voting duration in blocks (approximately 1 week at 10 min/block)
(define-constant voting-duration u1008)

;; Quorum requirement (% of total members that must vote)
(define-constant quorum-percentage u20)

;; Approval threshold (% of votes needed to pass)
(define-constant approval-threshold u51)

;; Data Variables
(define-data-var proposal-count uint u0)
(define-data-var member-count uint u0)

;; Data Maps
(define-map members principal bool)

(define-map proposals
  uint
  {
    proposer: principal,
    title: (string-ascii 256),
    description: (string-ascii 1024),
    recipient: principal,
    amount: uint,
    start-block: uint,
    end-block: uint,
    yes-votes: uint,
    no-votes: uint,
    executed: bool,
    cancelled: bool
  }
)
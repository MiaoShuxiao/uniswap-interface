import React, { useState } from 'react'
import { UNI } from '../../constants/tokens'

import Modal from '../Modal'
import { AutoColumn } from '../Column'
import styled from 'styled-components/macro'
import { RowBetween } from '../Row'
import { TYPE } from '../../theme'
import { X } from 'react-feather'
import { ButtonPrimary } from '../Button'
import { useActiveWeb3React } from '../../hooks/web3'
import AddressInputPanel from '../AddressInputPanel'
import { isAddress } from 'ethers/lib/utils'
import useENS from '../../hooks/useENS'
import { useDelegateCallback } from '../../state/governance/hooks'
import { useTokenBalance } from '../../state/wallet/hooks'
import { LoadingView, SubmittedView } from '../ModalViews'
import { formatTokenAmount } from 'utils/formatTokenAmount'
import { Trans } from '@lingui/macro'

const ContentWrapper = styled(AutoColumn)`
  width: 100%;
  padding: 24px;
`

const StyledClosed = styled(X)`
  :hover {
    cursor: pointer;
  }
`

const TextButton = styled.div`
  :hover {
    cursor: pointer;
  }
`

interface VoteModalProps {
  isOpen: boolean
  onDismiss: () => void
  title: string
}

export default function DelegateModal({ isOpen, onDismiss, title }: VoteModalProps) {
  const { account, chainId } = useActiveWeb3React()

  // state for delegate input
  const [usingDelegate, setUsingDelegate] = useState(false)
  const [typed, setTyped] = useState('')
  function handleRecipientType(val: string) {
    setTyped(val)
  }

  // monitor for self delegation or input for third part delegate
  // default is self delegation
  const activeDelegate = usingDelegate ? typed : account
  const { address: parsedAddress } = useENS(activeDelegate)

  // get the number of votes available to delegate
  const uniBalance = useTokenBalance(account ?? undefined, chainId ? UNI[chainId] : undefined)

  const delegateCallback = useDelegateCallback()

  // monitor call to help UI loading state
  const [hash, setHash] = useState<string | undefined>()
  const [attempting, setAttempting] = useState(false)

  // wrapper to reset state on modal close
  function wrappedOndismiss() {
    setHash(undefined)
    setAttempting(false)
    onDismiss()
  }

  async function onDelegate() {
    setAttempting(true)

    // if callback not returned properly ignore
    if (!delegateCallback) return

    // try delegation and store hash
    const hash = await delegateCallback(parsedAddress ?? undefined)?.catch((error) => {
      setAttempting(false)
      console.log(error)
    })

    if (hash) {
      setHash(hash)
    }
  }

  return (
    <Modal isOpen={isOpen} onDismiss={wrappedOndismiss} maxHeight={90}>
      {!attempting && !hash && (
        <ContentWrapper gap="lg">
          <AutoColumn gap="lg" justify="center">
            <RowBetween>
              <TYPE.mediumHeader fontWeight={500}>{title}</TYPE.mediumHeader>
              <StyledClosed stroke="black" onClick={wrappedOndismiss} />
            </RowBetween>
            <TYPE.body>
              <Trans id="vote.delegate.hint1">Earned UNI tokens represent voting shares in Uniswap governance.</Trans>
            </TYPE.body>
            <TYPE.body>
              <Trans id="vote.delegate.hint2">
                You can either vote on each proposal yourself or delegate your votes to a third party.arned UNI tokens
                represent voting shares in Uniswap governance.
              </Trans>
            </TYPE.body>
            {usingDelegate && <AddressInputPanel value={typed} onChange={handleRecipientType} />}
            <ButtonPrimary disabled={!isAddress(parsedAddress ?? '')} onClick={onDelegate}>
              <TYPE.mediumHeader color="white">
                {usingDelegate ? (
                  <Trans id="vote.delegate.delegateVotes">Delegate Votes</Trans>
                ) : (
                  <Trans id="vote.delegate.selfDelegate">Self Delegate</Trans>
                )}
              </TYPE.mediumHeader>
            </ButtonPrimary>
            <TextButton onClick={() => setUsingDelegate(!usingDelegate)}>
              <TYPE.blue>
                {usingDelegate ? (
                  <Trans id="common.remove">Remove</Trans>
                ) : (
                  <Trans id="common.add">Add Delegate +</Trans>
                )}
              </TYPE.blue>
            </TextButton>
          </AutoColumn>
        </ContentWrapper>
      )}
      {attempting && !hash && (
        <LoadingView onDismiss={wrappedOndismiss}>
          <AutoColumn gap="12px" justify={'center'}>
            <TYPE.largeHeader>
              {usingDelegate ? (
                <Trans id="vote.delegate.delegatingVotes">Delegating votes</Trans>
              ) : (
                <Trans id="vote.delegates.unlockingVotes">Unlocking Votes</Trans>
              )}
            </TYPE.largeHeader>
            <TYPE.main fontSize={36}> {formatTokenAmount(uniBalance, 4)}</TYPE.main>
          </AutoColumn>
        </LoadingView>
      )}
      {hash && (
        <SubmittedView onDismiss={wrappedOndismiss} hash={hash}>
          <AutoColumn gap="12px" justify={'center'}>
            <TYPE.largeHeader>
              <Trans id="transactions.submitted">Transaction Submitted</Trans>
            </TYPE.largeHeader>
            <TYPE.main fontSize={36}>{formatTokenAmount(uniBalance, 4)}</TYPE.main>
          </AutoColumn>
        </SubmittedView>
      )}
    </Modal>
  )
}

import React, {
  FunctionComponent,
  Fragment,
  useContext,
  useEffect,
  useReducer,
} from 'react'
import ApolloClient, { ApolloQueryResult } from 'apollo-client'
import { NormalizedCacheObject } from 'apollo-cache-inmemory'
import { withApollo } from 'react-apollo'
import { ProductContext, Product } from 'vtex.product-context'
import Stars from './components/Stars'
import ReviewForm from './ReviewForm'
import { generateBlockClass, BlockClass } from '@vtex/css-handles'
import styles from './styles.css'
import ReviewsByProductId from '../graphql/reviewsByProductId.graphql'
import TotalReviewsByProductId from '../graphql/totalReviewsByProductId.graphql'
import AverageRatingByProductId from '../graphql/averageRatingByProductId.graphql'

import {
  IconSuccess,
  Pagination,
  Collapsible,
  Dropdown,
  //Button,
} from 'vtex.styleguide'

interface Props {
  client: ApolloClient<NormalizedCacheObject>
}

interface Review {
  id: number
  cacheId: number
  productId: string
  rating: number
  title: string
  text: string
  reviewerName: string
  shopperId: string
  reviewDateTime: string
  verifiedPurchaser: boolean
}

interface ReviewsData {
  reviewsByProductId: Review[]
}

interface TotalData {
  totalReviewsByProductId: number
}

interface AverageData {
  averageRatingByProductId: number
}

interface State {
  sort: string
  offset: number
  limit: number
  reviews: Review[] | null
  total: number
  average: number
  hasTotal: boolean
  hasAverage: boolean
  showForm: boolean
}

type ReducerActions =
  | { type: 'SET_NEXT_PAGE' }
  | { type: 'SET_PREV_PAGE' }
  | { type: 'TOGGLE_REVIEW_FORM' }
  | { type: 'SET_SELECTED_SORT'; args: { sort: string } }
  | { type: 'SET_REVIEWS'; args: { reviews: Review[] } }
  | { type: 'SET_TOTAL'; args: { total: number } }
  | { type: 'SET_AVERAGE'; args: { average: number } }

const options = [
  {
    label: 'Most Recent',
    value: 'ReviewDateTime:desc',
  },
  {
    label: 'Oldest',
    value: 'ReviewDateTime:asc',
  },
  {
    label: 'Highest Rated',
    value: 'Rating:desc',
  },
  {
    label: 'Lowest Rated',
    value: 'Rating:asc',
  },
]

const getTimeAgo = (time: string) => {
  let before = new Date(time + ' UTC')
  let now = new Date()
  let diff = new Date(now.valueOf() - before.valueOf())

  let minutes = diff.getUTCMinutes()
  let hours = diff.getUTCHours()
  let days = diff.getUTCDate() - 1
  let months = diff.getUTCMonth()
  let years = diff.getUTCFullYear() - 1970

  if (years > 0) {
    return `${years} ${years > 1 ? 'years' : 'year'} ago`
  } else if (months > 0) {
    return `${months} ${months > 1 ? 'months' : 'month'} ago`
  } else if (days > 0) {
    return `${days} ${days > 1 ? 'days' : 'day'} ago`
  } else if (hours > 0) {
    return `${hours} ${hours > 1 ? 'hours' : 'hour'} ago`
  } else if (minutes > 0) {
    return `${minutes} ${minutes > 1 ? 'minutes' : 'minute'} ago`
  } else {
    return `just now`
  }
}

const initialState = {
  sort: 'ReviewDateTime:desc',
  offset: 0,
  limit: 10,
  reviews: null,
  total: 0,
  average: 0,
  hasTotal: false,
  hasAverage: false,
  showForm: false,
}

const reducer = (state: State, action: ReducerActions) => {
  switch (action.type) {
    case 'SET_NEXT_PAGE':
      return {
        ...state,
        offset: state.offset + state.limit,
      }
    case 'SET_PREV_PAGE':
      return {
        ...state,
        offset: state.offset - state.limit < 0 ? 0 : state.offset - state.limit,
      }
    case 'TOGGLE_REVIEW_FORM':
      return {
        ...state,
        showForm: !state.showForm,
      }
    case 'SET_SELECTED_SORT':
      return {
        ...state,
        sort: action.args.sort,
      }
    case 'SET_REVIEWS':
      return {
        ...state,
        reviews: action.args.reviews || [],
      }
    case 'SET_TOTAL':
      return {
        ...state,
        total: action.args.total,
        hasTotal: true,
      }
    case 'SET_AVERAGE':
      return {
        ...state,
        average: action.args.average,
        hasAverage: true,
      }
  }
}

const Reviews: FunctionComponent<BlockClass & Props> = props => {
  const { blockClass, client } = props

  const baseClassNames = generateBlockClass(styles.container, blockClass)
  const { product }: ProductContext = useContext(ProductContext)
  const { productId }: Product = product || {}

  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    if (!productId) {
      return
    }

    client
      .query({
        query: TotalReviewsByProductId,
        variables: {
          productId: productId,
        },
      })
      .then((response: ApolloQueryResult<TotalData>) => {
        const total = response.data.totalReviewsByProductId
        dispatch({
          type: 'SET_TOTAL',
          args: { total },
        })
      })

    client
      .query({
        query: AverageRatingByProductId,
        variables: {
          productId: productId,
        },
      })
      .then((response: ApolloQueryResult<AverageData>) => {
        const average = response.data.averageRatingByProductId
        dispatch({
          type: 'SET_AVERAGE',
          args: { average },
        })
      })
  }, [client, productId])

  useEffect(() => {
    if (!productId) {
      return
    }
    client
      .query({
        query: ReviewsByProductId,
        variables: {
          productId: productId,
          offset: state.offset,
          limit: state.limit,
          orderBy: state.sort,
        },
        fetchPolicy: 'no-cache',
      })
      .then((response: ApolloQueryResult<ReviewsData>) => {
        const reviews = response.data.reviewsByProductId
        dispatch({
          type: 'SET_REVIEWS',
          args: { reviews },
        })
      })
  }, [client, productId, state.limit, state.offset, state.sort])

  return (
    <div className={`${baseClassNames} review mw8 center ph5`}>
      <h3 className="review__title t-heading-3 bb b--muted-5 mb5">Reviews</h3>
      <div className="review__rating">
        {!state.hasTotal || !state.hasAverage ? (
          <Fragment>Loading summary...</Fragment>
        ) : state.total == 0 ? null : (
          <Fragment>
            <div className="t-heading-4">
              <Stars rating={state.average} />
            </div>
            <span className="review__rating--average dib v-mid">
              {state.average} Average Rating
            </span>{' '}
            <span className="review__rating--count dib v-mid">
              ({state.total} Reviews)
            </span>
          </Fragment>
        )}
      </div>
      <div className="mv5">
        <Collapsible
          header={
            <span className="c-action-primary hover-c-action-primary">
              Write a review
            </span>
          }
          onClick={() => {
            dispatch({
              type: 'TOGGLE_REVIEW_FORM',
            })
          }}
          isOpen={state.showForm}
        >
          <ReviewForm />
        </Collapsible>
      </div>
      <div className="review__comments">
        {state.reviews === null ? (
          <Fragment>Loading reviews...</Fragment>
        ) : state.reviews.length ? (
          <Fragment>
            <div className="flex mb7">
              <div className="mr4">
                <Dropdown
                  options={options}
                  onChange={(event: React.FormEvent<HTMLSelectElement>) => {
                    dispatch({
                      type: 'SET_SELECTED_SORT',
                      args: { sort: event.currentTarget.value },
                    })
                  }}
                  value={state.sort}
                />
              </div>
            </div>
            {state.reviews.map((review, i) => {
              return (
                <div
                  key={i}
                  className="review__comment bw2 bb b--muted-5 mb5 pb4"
                >
                  <div className="review__comment--rating t-heading-5">
                    <Stars rating={review.rating} />
                  </div>
                  <h5 className="review__comment--user lh-copy mw9 t-heading-5 mt0 mb2">
                    {review.title}
                  </h5>
                  <ul className="pa0 mv2">
                    {review.verifiedPurchaser ? (
                      <li className="dib mr5">
                        <IconSuccess /> Verified Purchaser
                      </li>
                    ) : null}
                    <li className="dib mr2">
                      <strong>Submitted</strong>{' '}
                      {getTimeAgo(review.reviewDateTime)}
                    </li>
                    <li className="dib mr5">
                      <strong>by</strong> {review.reviewerName}
                    </li>
                  </ul>
                  <p className="t-body lh-copy mw9">{review.text}</p>
                </div>
              )
            })}
            <div className="review__paging">
              <Pagination
                textShowRows=""
                currentItemFrom={state.offset + 1}
                currentItemTo={state.offset + state.limit}
                textOf="of"
                totalItems={state.total}
                onNextClick={() => {
                  dispatch({
                    type: 'SET_NEXT_PAGE',
                  })
                }}
                onPrevClick={() => {
                  dispatch({
                    type: 'SET_PREV_PAGE',
                  })
                }}
              />
            </div>
          </Fragment>
        ) : (
          <div className="review__comment bw2 bb b--muted-5 mb5 pb4">
            <h5 className="review__comment--user lh-copy mw9 t-heading-5 mv5">
              No reviews.
            </h5>
          </div>
        )}
      </div>
    </div>
  )
}

export default withApollo(Reviews)
